import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { multiSorter, numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import { OriginGameIndicator } from '@openhome-ui/components/pokemon/indicator/OriginGame'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { Flex } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
import SortableDataGrid from 'src/ui/components/SortableDataGrid'
import { useLookups } from 'src/ui/state/lookups/useLookups'
import { BackendContext } from '../../backend/backendContext'
import { ItemBuilder, OpenHomeCtxMenu } from '../../components/context-menu'

type G345LookupRow = {
  gen345ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen345LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen345Lookup({ onSelectMon }: Gen345LookupProps) {
  const ohpkmStore = useOhpkmStore()
  const { lookups } = useLookups()
  const backend = useContext(BackendContext)

  const contextElements = useMemo(
    () => [ItemBuilder.fromLabel('Remove All Dangling Lookups').withAction(backend.removeDangling)],
    [backend.removeDangling]
  )

  const columns: SortableColumn<G345LookupRow>[] = useMemo(
    () => [
      {
        key: 'Pokémon',
        name: 'Mon',
        width: '5rem',
        renderValue: (value) =>
          value.homeMon && (
            <button
              onClick={() => value.homeMon && onSelectMon(value.homeMon)}
              className="mon-icon-button"
            >
              <PokemonIcon
                dexNumber={value.homeMon.dexNum}
                formeNumber={value.homeMon.formeNum}
                style={{ width: 30, height: 30 }}
              />
            </button>
          ),
        cellClass: 'centered-cell',
      },
      {
        key: 'game',
        name: 'Original Game',
        width: '10rem',
        renderValue: (value) => (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <OriginGameIndicator
              originGame={value.homeMon?.gameOfOrigin}
              plugin={value.homeMon?.pluginOrigin as PluginIdentifier}
              withName
            />
          </div>
        ),
        sortFunction: multiSorter(
          numericSorter((val) => val.homeMon?.gameOfOrigin),
          stringSorter((val) => val.homeMon?.pluginOrigin ?? '.') // so official games come before plugins
        ),
        cellClass: 'centered-cell',
      },
      {
        key: 'gen345ID',
        name: 'Gen 3/4/5',
        width: '12rem',
        sortFunction: stringSorter((val) => val.gen345ID),
        cellClass: 'mono-cell',
      },
      {
        key: 'homeID',
        name: 'OpenHome',
        minWidth: 180,
        sortFunction: stringSorter((val) => val.homeID),
        cellClass: 'mono-cell',
      },
    ],
    [onSelectMon]
  )

  const modifiedColumns = useMemo(
    () =>
      columns.map((column) => {
        const newColumn = { ...column }
        if (newColumn.renderCell) {
          const renderCell = newColumn.renderCell
          newColumn.renderCell = (props) => (
            <OpenHomeCtxMenu elements={contextElements}>
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
              <OpenHomeCtxMenu key={value.homeID} elements={contextElements}>
                <Flex height="100%" align="center" justify={justify} width="100%">
                  {rendered}
                </Flex>
              </OpenHomeCtxMenu>
            )
          }
        } else {
          newColumn.renderValue = (value) => {
            const data = value[column.key as keyof G345LookupRow]
            const justify = typeof data === 'string' ? 'start' : 'center'
            return (
              typeof data === 'string' && (
                <OpenHomeCtxMenu key={value.homeID} elements={contextElements}>
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
    [columns, contextElements]
  )

  return (
    <SortableDataGrid
      rows={Object.entries(lookups.gen345).map(([gen345ID, homeID]) => ({
        gen345ID,
        homeID,
        homeMon: ohpkmStore.getById(homeID),
      }))}
      columns={modifiedColumns}
      enableVirtualization={Object.entries(lookups.gen345).length > 2000} // maybe this should be user-togglable
    />
  )
}
