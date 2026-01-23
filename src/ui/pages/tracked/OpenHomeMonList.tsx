import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier, SAV } from '@openhome-core/save/interfaces'
import { multiSorter, numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import { OriginGameIndicator } from '@openhome-ui/components/pokemon/indicator/OriginGame'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import { useCallback, useMemo, useState } from 'react'
import { OhpkmIdentifier } from 'src/core/pkm/Lookup'
import { ItemBuilder, OpenHomeCtxMenu } from '../../components/context-menu'
import './style.css'

export type OpenHomeMonListProps = {
  onSelectMon: (mon: OHPKM) => void
  findSaveForMon: (identifier: string) => Promise<SAV | undefined>
  findSavesForAllMons: () => Promise<void>
}

export default function OpenHomeMonList({
  onSelectMon,
  findSaveForMon,
  findSavesForAllMons,
}: OpenHomeMonListProps) {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()
  const rows = useMemo(
    () => ohpkmStore.getAllStored().toSorted(stringSorter((mon) => mon.openhomeId)),
    [ohpkmStore]
  )
  const { selectedIds, deselectIds, shiftClick, singleClick } = useSelectedMons(rows)

  const buildContextElements = useCallback(
    (mon: OHPKM) => {
      return [
        ItemBuilder.fromLabel('Find Containing Save').withAction(() =>
          findSaveForMon(mon.openhomeId)
        ),
        ItemBuilder.fromLabel('Find Recent Saves For All').withAction(findSavesForAllMons),
        selectedIds.size > 0
          ? ItemBuilder.fromLabel('Delete Selected ' + selectedIds.size).withAction(() => {
              deselectIds(...selectedIds)
            })
          : undefined,
      ]
    },
    [deselectIds, findSaveForMon, findSavesForAllMons, selectedIds]
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
          const bankIndex = saves.homeData.findIfPresent(value.openhomeId)?.bank
          return typeof bankIndex === 'number' ? `Bank ${bankIndex + 1}` : undefined
        },
        getFilterValue: (value) => saves.homeData.findIfPresent(value.openhomeId)?.bank?.toString(),
        sortFunction: numericSorter((mon) => saves.homeData.findIfPresent(mon.openhomeId)?.bank),
      },
      {
        key: 'home_box',
        name: 'Box + Slot',
        width: '8rem',
        renderValue: (mon) => {
          const location = saves.homeData.findIfPresent(mon.openhomeId)
          return location ? (
            <span>
              <b>Box {location.box + 1}</b> [{location.boxSlot + 1}]
            </span>
          ) : undefined
        },
        getFilterValue: (mon) => {
          const location = saves.homeData.findIfPresent(mon.openhomeId)
          return location ? `Box ${location.box + 1}` : 'Not in OpenHome Boxes'
        },
        sortFunction: numericSorter((mon) => {
          const location = saves.homeData.findIfPresent(mon.openhomeId)
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
          stringSorter((val) => val?.pluginOrigin ?? '.') // ensure official games come before plugins with the same origin (e.g. FireRed + Unbound)
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
        sortFunction: stringSorter((mon) => mon.openhomeId),
        renderValue: (mon) => mon.openhomeId,
        cellClass: 'mono-cell',
      },
    ],
    [onSelectMon, saves.homeData]
  )

  const keyGetter = (row: NoInfer<OHPKM>): string => {
    return row.openhomeId
  }

  return (
    <OpenHomeCtxMenu elements={buildContextElements(rows[0])}>
      <div style={{ height: '100%', width: '100%' }}>
        <SortableDataGrid
          rows={ohpkmStore.getAllStored().toSorted(stringSorter((mon) => mon.openhomeId))}
          columns={columns}
          style={{ borderLeft: 'none', borderBottom: 'none' }}
          rowKeyGetter={keyGetter}
          onCellClick={(props, e) => {
            if (e.shiftKey) {
              shiftClick(props.row.openhomeId, props.rowIdx)
              return
            }
            singleClick(props.row.openhomeId, props.rowIdx)
          }}
          onCellContextMenu={(_, e) => {
            // ooh i hate this, radix please expose your context menu api
            const menu = document.querySelector('[data-radix-popper-content-wrapper]')
            if (menu) {
              ;(menu as HTMLElement).style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
            }
          }}
          rowClass={(row) => (selectedIds.has(row.openhomeId) ? 'selected-row' : undefined)}
        />
      </div>
    </OpenHomeCtxMenu>
  )
}

function useSelectedMons(monsInOrder: OHPKM[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null)

  function selectIds(...ids: OhpkmIdentifier[]) {
    setSelectedIds((prev) => new Set(ids).union(prev))
  }

  function deselectIds(...ids: OhpkmIdentifier[]) {
    setSelectedIds((prev) => new Set(prev).difference(new Set(ids)))
  }

  function singleClick(id: OhpkmIdentifier, index: number) {
    if (selectedIds.size === 1 && selectedIds.has(id)) {
      setSelectedIds(new Set())
      setLastClickedIndex(null)
    } else {
      setSelectedIds(new Set([id]))
      setLastClickedIndex(index)
    }
  }

  function shiftClick(id: OhpkmIdentifier, index: number) {
    if (lastClickedIndex === null) {
      singleClick(id, index)
    } else {
      selectIds(
        ...monsInOrder
          .slice(Math.min(lastClickedIndex, index), Math.max(lastClickedIndex, index) + 1)
          .map((mon) => mon.openhomeId)
      )
    }
  }

  return { selectedIds, selectIds, deselectIds, singleClick, shiftClick }
}
