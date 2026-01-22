import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { multiSorter, numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import { OriginGameIndicator } from '@openhome-ui/components/pokemon/indicator/OriginGame'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'
import { useCallback, useMemo } from 'react'
import { PathData } from '../../../core/save/util/path'
import { ItemBuilder, OpenHomeCtxMenu } from '../../components/context-menu'
import './style.css'

export type OpenHomeMonListProps = {
  onSelectMon: (mon: OHPKM) => void
  findSaveForMon: (identifier: string) => Promise<PathData | undefined>
}

export default function OpenHomeMonList({ onSelectMon, findSaveForMon }: OpenHomeMonListProps) {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()

  const buildContextElements = useCallback(
    (mon: OHPKM) => [
      ItemBuilder.fromLabel('Find Containing Save').withAction(() =>
        findSaveForMon(mon.getHomeIdentifier())
      ),
    ],
    [findSaveForMon]
  )

  const columns: SortableColumn<OHPKM>[] = useMemo(
    () => [
      {
        key: 'Pokémon',
        name: 'Mon',
        width: '5rem',
        renderValue: (value) => (
          <button onClick={() => onSelectMon(value)} className="mon-icon-button">
            <PokemonIcon
              dexNumber={value.dexNum}
              formeNumber={value.formeNum}
              style={{ width: 30, height: 30 }}
            />
          </button>
        ),
        cellClass: 'centered-cell',
        sortFunction: multiSorter(
          numericSorter((mon) => mon.dexNum),
          numericSorter((mon) => mon.formeNum)
        ),
        getFilterValue: (value) =>
          MetadataLookup(value.dexNum, value.formeNum)?.speciesName || 'Unknown',
      },
      {
        key: 'nickname',
        name: 'Nickname',
        width: '8rem',
        sortFunction: stringSorter((mon) => mon.nickname),
        noFilter: true,
      },
      {
        key: 'home_bank',
        name: 'Bank',
        width: '4rem',
        renderValue: (value) => {
          const bankIndex = saves.homeData.findIfPresent(value.getHomeIdentifier())?.bank
          return typeof bankIndex === 'number' ? `Bank ${bankIndex + 1}` : undefined
        },
        getFilterValue: (value) =>
          saves.homeData.findIfPresent(value.getHomeIdentifier())?.bank?.toString(),
        sortFunction: numericSorter(
          (mon) => saves.homeData.findIfPresent(mon.getHomeIdentifier())?.bank
        ),
      },
      {
        key: 'home_box',
        name: 'Box + Slot',
        width: '8rem',
        renderValue: (mon) => {
          const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
          return location ? (
            <span>
              <b>Box {location.box + 1}</b> [{location.boxSlot + 1}]
            </span>
          ) : undefined
        },
        getFilterValue: (mon) => {
          const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
          return location ? `Box ${location.box + 1}` : 'Not in OpenHome Boxes'
        },
        sortFunction: numericSorter((mon) => {
          const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
          return location ? location.box + location.boxSlot / 120 : -1
        }),
      },
      {
        key: 'last_save',
        name: 'Last Save',
        width: '9rem',
        renderValue: (value) => (
          <div className="flex-row-centered">
            <OriginGameIndicator
              originGame={value.mostRecentSaveWasm?.game}
              withName
              tooltip={value.mostRecentSaveWasm?.file_path}
            />
          </div>
        ),
        cellClass: 'centered-cell',
      },
      {
        key: 'level',
        name: 'Level',
        width: '4rem',
        renderValue: (value) => value.getLevel(),
      },
      {
        key: 'game',
        name: 'Original Game',
        width: '10rem',
        renderValue: (value) => (
          <div className="flex-row-centered">
            <OriginGameIndicator
              originGame={value.gameOfOrigin}
              plugin={value.pluginOrigin as PluginIdentifier}
              withName
            />
          </div>
        ),
        sortFunction: multiSorter(
          numericSorter((val) => val?.gameOfOrigin),
          stringSorter((val) => val?.pluginOrigin ?? '.') // so official games come before plugins
        ),
        cellClass: 'centered-cell',
      },
      {
        key: 'trainerName',
        name: 'OT',
        width: '6rem',
      },
      {
        key: 'homeID',
        name: 'OpenHome ID',
        minWidth: 240,
        sortFunction: stringSorter((mon) => mon.getHomeIdentifier()),
        renderValue: (mon) => mon.getHomeIdentifier(),
        cellClass: 'mono-cell',
      },
    ],
    [onSelectMon, saves.homeData]
  )

  const modifiedColumns = useMemo(
    () =>
      columns.map((column) => {
        const newColumn = { ...column }
        if (newColumn.renderCell) {
          const renderCell = newColumn.renderCell
          newColumn.renderCell = (props) => (
            <OpenHomeCtxMenu elements={buildContextElements(props.row)}>
              <Flex height="100%" align="center" justify="center" width="100%">
                {renderCell(props)}
              </Flex>
            </OpenHomeCtxMenu>
          )
        } else if (newColumn.renderValue) {
          const renderValue = newColumn.renderValue
          newColumn.renderValue = (value) => {
            const rendered = renderValue(value)
            const justify = typeof rendered === 'string' ? 'start' : 'center'
            return (
              <OpenHomeCtxMenu
                key={value.getHomeIdentifier()}
                elements={buildContextElements(value)}
              >
                <Flex height="100%" align="center" justify={justify} width="100%">
                  {rendered}
                </Flex>
              </OpenHomeCtxMenu>
            )
          }
        } else {
          newColumn.renderValue = (value) => {
            const data = value[column.key as keyof OHPKM]
            const justify = typeof data === 'string' ? 'start' : 'center'
            return (
              typeof data === 'string' && (
                <OpenHomeCtxMenu
                  key={value.getHomeIdentifier()}
                  elements={buildContextElements(value)}
                >
                  <Flex height="100%" justify={justify} width="100%">
                    {data}
                  </Flex>
                </OpenHomeCtxMenu>
              )
            )
          }
        }
        return newColumn
      }),
    [buildContextElements, columns]
  )

  const keyGetter = (row: NoInfer<OHPKM>): string => {
    return row.getHomeIdentifier()
  }

  return (
    <SortableDataGrid
      rows={ohpkmStore.getAllStored()}
      columns={modifiedColumns}
      style={{ borderLeft: 'none', borderBottom: 'none' }}
      rowKeyGetter={keyGetter}
    />
  )
}
