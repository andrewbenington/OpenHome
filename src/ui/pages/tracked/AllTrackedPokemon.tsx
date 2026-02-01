import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier, SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import {
  gameOrPluginSorter,
  gameSorter,
  multiSorter,
  numericSorter,
  SortableColumn,
  stringSorter,
} from '@openhome-core/util/sort'
import {
  CtxMenuElementBuilder,
  ItemBuilder,
  LabelBuilder,
  OpenHomeCtxMenu,
  SeparatorBuilder,
} from '@openhome-ui/components/context-menu'
import { OriginGameIndicator } from '@openhome-ui/components/pokemon/indicator/OriginGame'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup, OriginGames } from '@pkm-rs/pkg'
import { useCallback, useRef, useState } from 'react'
import { SelectColumn } from 'react-data-grid'
import { BankBoxCoordinates, HomeData } from 'src/core/save/HomeData'
import './style.css'

export type AllTrackedPokemonProps = {
  onSelectMon: (mon: OHPKM) => void
  findSaveForMon: (identifier: string) => Promise<SAV | undefined>
  findSavesForAllMons: () => Promise<void>
}

export default function AllTrackedPokemon({
  onSelectMon,
  findSaveForMon,
  findSavesForAllMons,
}: AllTrackedPokemonProps) {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()
  const selectionController = useSelectedMons()
  const { selectedIds, deselectIds } = selectionController
  const [contextMenuBuilders, setContextMenuBuilders] = useState<Option<CtxMenuElementBuilder>[]>(
    []
  )
  const [ctxMenuMonId, setCtxMenuMonId] = useState<Option<OhpkmIdentifier>>()
  const { releaseMonsById, trackedMonsToRelease } = saves
  const columns = useColumns(trackedMonsToRelease, onSelectMon, saves.homeData)

  const buildContextElements = useCallback(
    (mon: OHPKM) => {
      const actions: CtxMenuElementBuilder[] = [
        LabelBuilder.fromMon(mon),
        ItemBuilder.fromLabel('Find Containing Save').withAction(() =>
          findSaveForMon(mon.openhomeId)
        ),
        ItemBuilder.fromLabel(`Move To Release Area`).withAction(() => {
          releaseMonsById(mon.openhomeId)
          deselectIds(mon.openhomeId)
        }),
      ]

      if (selectedIds.size > 0) {
        actions.push(
          SeparatorBuilder,
          LabelBuilder.fromLabel(`Bulk Actions (${selectedIds.size} selected)`),
          ItemBuilder.fromLabel(`Move Selected To Release Area`).withAction(() => {
            releaseMonsById(...selectedIds)
            deselectIds(...selectedIds)
          })
        )
      }

      actions.push(
        SeparatorBuilder,
        LabelBuilder.fromLabel(`For All Tracked`),
        ItemBuilder.fromLabel('Find Recent Saves For All').withAction(findSavesForAllMons)
      )
      return actions
    },
    [deselectIds, findSaveForMon, findSavesForAllMons, releaseMonsById, selectedIds]
  )

  const keyGetter = (row: NoInfer<OHPKM>): string => {
    return row.openhomeId
  }

  return (
    <OpenHomeCtxMenu
      elements={contextMenuBuilders}
      onOpenChange={(open) => {
        if (!open) setCtxMenuMonId(undefined)
      }}
      style={{ overflow: 'hidden' }}
    >
      {/* this div is necessary to give the context menu a target */}
      <div style={{ height: '100%', width: '100%' }}>
        <SortableDataGrid
          rows={ohpkmStore.getAllStored().toSorted(stringSorter((mon) => mon.openhomeId))}
          columns={columns}
          style={{ borderLeft: 'none' }}
          rowKeyGetter={keyGetter}
          onCellContextMenu={(props, e) => {
            setCtxMenuMonId(props.row.openhomeId)
            setContextMenuBuilders(buildContextElements(props.row))
            // ooh i hate this, radix please expose your context menu api
            const menu = document.querySelector('[data-radix-popper-content-wrapper]')
            if (menu) {
              ;(menu as HTMLElement).style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
            }
          }}
          rowClass={(row) =>
            trackedMonsToRelease.includes(row.openhomeId)
              ? 'releasing-mon-row'
              : selectedIds.has(row.openhomeId) || ctxMenuMonId === row.openhomeId
                ? 'selected-row'
                : undefined
          }
          isRowSelectionDisabled={(row) => trackedMonsToRelease.includes(row.openhomeId)}
          selectedRows={selectedIds}
          // onSortColumnsChange={onColOrderingChange}
          onSelectedRowsChange={(ids) =>
            selectionController.forceSetSelectedIds(ids as Set<OhpkmIdentifier>)
          }
        />
      </div>
    </OpenHomeCtxMenu>
  )
}

function useSelectedMons() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function selectIds(...ids: OhpkmIdentifier[]) {
    setSelectedIds((prev) => new Set(ids).union(prev))
  }

  function deselectIds(...ids: OhpkmIdentifier[]) {
    setSelectedIds((prev) => new Set(prev).difference(new Set(ids)))
  }

  function forceSetSelectedIds(ids: Set<string>) {
    setSelectedIds(new Set(ids))
  }

  return {
    selectedIds,
    selectIds,
    deselectIds,
    forceSetSelectedIds,
  }
}

function locationToSortableString(location: Option<BankBoxCoordinates>): string {
  if (!location) {
    return 'NO_LOCATION'
  }
  return `$${location.box.toString().padStart(3, '0')}~${location.boxSlot.toString().padStart(3, '0')}`
}

function useColumns(
  trackedMonsToRelease: OhpkmIdentifier[],
  onSelectMon: (mon: OHPKM) => void,
  homeData: HomeData
): SortableColumn<OHPKM>[] {
  const saves = useSaves()

  // this is necessary because the renderer functions do not update correctly when dependencies change
  const trackedMonsRef = useRef(trackedMonsToRelease)
  trackedMonsRef.current = trackedMonsToRelease

  return [
    { ...SelectColumn, minWidth: 36, width: undefined },
    {
      key: 'Pokémon',
      name: 'Mon',
      width: '3rem',
      frozen: true,
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
      width: '5rem',
      renderValue: (mon) => {
        if (trackedMonsRef.current.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const bankIndex = homeData.findIfPresent(mon.openhomeId)?.bank
        return typeof bankIndex === 'number' ? `Bank ${bankIndex + 1}` : undefined
      },
      getFilterValue: (mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) return 'Release Area'
        const bankIndex = saves.homeData.findIfPresent(mon.openhomeId)?.bank
        return bankIndex !== undefined ? `Bank ${bankIndex + 1}` : 'Not in OpenHome Boxes'
      },
      sortFunction: numericSorter((mon) =>
        trackedMonsToRelease.includes(mon.openhomeId)
          ? Number.POSITIVE_INFINITY
          : homeData.findIfPresent(mon.openhomeId)?.bank
      ),
    },
    {
      key: 'home_box',
      name: 'Box + Slot',
      width: '8rem',
      renderValue: (mon: OHPKM) => {
        if (trackedMonsRef.current.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const location = homeData.findIfPresent(mon.openhomeId)
        return location ? (
          <span>
            <b>Box {location.box + 1}</b> [{location.boxSlot + 1}]
          </span>
        ) : undefined
      },
      getFilterValue: (mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const location = homeData.findIfPresent(mon.openhomeId)
        return location ? `Box ${location.box + 1}` : 'Not in OpenHome Boxes'
      },
      sortFunction: stringSorter((mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) {
          return '$RELEASE'
        }
        const location = homeData.findIfPresent(mon.openhomeId)
        return locationToSortableString(location)
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
      getFilterValue: (mon) => {
        const game = mon.mostRecentSaveWasm?.game
        return game ? OriginGames.gameName(game) : '(Unknown)'
      },
      cellClass: 'centered-cell',
      sortFunction: gameSorter((mon) => mon.mostRecentSaveWasm?.game),
    },
    {
      key: 'level',
      name: 'Level',
      width: '6rem',
      renderValue: (value) => value.getLevel(),
      getFilterValue: (mon) => getLevelRange(mon.getLevel()),
      getFilterValueDropdownPos: (filterValue) =>
        filterValue ? levelRangeOrderPos(filterValue as LevelRangeBy10) : 0,
      sortFunction: numericSorter((mon) => mon.getLevel()),
    },
    {
      key: 'game',
      name: 'Original Game',
      width: '10rem',
      renderValue: (value) => (
        <OriginGameIndicator
          originGame={value.gameOfOrigin}
          plugin={value.pluginOrigin as PluginIdentifier}
          withName
        />
      ),
      getFilterValue: (mon) => OriginGames.gameName(mon.gameOfOrigin),
      sortFunction: gameOrPluginSorter(
        (mon) => mon.gameOfOrigin,
        (mon) => mon.pluginOrigin
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
  ]
}

type LevelRangeBy10 =
  | '1-10'
  | '11-20'
  | '21-30'
  | '31-40'
  | '41-50'
  | '51-60'
  | '61-70'
  | '71-80'
  | '81-90'
  | '91-99'
  | '100'

function getLevelRange(level: number): Option<LevelRangeBy10> {
  if (level === 100) return '100'
  switch (Math.floor((level - 1) / 10)) {
    case 0:
      return '1-10'
    case 1:
      return '11-20'
    case 2:
      return '21-30'
    case 3:
      return '31-40'
    case 4:
      return '41-50'
    case 5:
      return '51-60'
    case 6:
      return '61-70'
    case 7:
      return '71-80'
    case 8:
      return '81-90'
    case 9:
      return '91-99'
    default:
      return undefined
  }
}

function levelRangeOrderPos(levelRange: LevelRangeBy10): number {
  if (levelRange === '100') return Number.POSITIVE_INFINITY

  return parseInt(levelRange.split('-')[0])
}
