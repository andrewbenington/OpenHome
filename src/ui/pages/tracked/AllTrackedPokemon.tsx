import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import {
  CtxMenuElementBuilder,
  Item,
  Label,
  OpenHomeCtxMenu,
  Separator,
} from '@openhome-ui/components/context-menu'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { usePokemonTable } from '@openhome-ui/hooks/pokemonTable'
import { OhpkmRowData, useOhpkmColumns } from '@openhome-ui/ohpkmGrid'
import { useBanksAndBoxes } from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { useSaves } from '@openhome-ui/state/saves'
import { Spinner } from '@radix-ui/themes'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import './style.css'

export type AllTrackedPokemonProps = {
  onSelectMon: (openhomeId: OhpkmIdentifier) => void
  findSaveForMon: (identifier: string) => Promise<SAV | undefined>
  findSavesForAllMons: () => Promise<void>
}

export default function AllTrackedPokemon({
  onSelectMon,
  findSaveForMon,
  findSavesForAllMons,
}: AllTrackedPokemonProps) {
  const saves = useSaves()
  const [contextMenuBuilders, setContextMenuBuilders] = useState<Option<CtxMenuElementBuilder>[]>(
    []
  )
  const [ctxMenuMonId, setCtxMenuMonId] = useState<Option<OhpkmIdentifier>>()
  const selectionController = useSelectedMons()
  const { selectedIds, forceSetSelectedIds } = selectionController
  const { trackedMonsToRelease } = saves
  const columns = useOhpkmColumns(onSelectMon)
  const tableContainerRef = useRef<HTMLDivElement>(null) // for listening to scroll
  const { buildContextElements } = useContextMenu(
    findSaveForMon,
    findSavesForAllMons,
    selectionController
  )

  const { currentRows, fetchMoreOnBottomReached, query, totalRowCount } = usePokemonTable(
    'all-tracked-pokemon',
    []
  )

  const { isFetching, isLoading } = query

  if (isLoading) return <Spinner />

  return (
    <OpenHomeCtxMenu
      elements={contextMenuBuilders}
      onOpenChange={(open: boolean) => {
        if (!open) setCtxMenuMonId(undefined)
      }}
      style={{ overflow: 'hidden', height: '100%' }}
    >
      {/* this div is necessary to give the context menu a target */}
      <div style={{ height: '100%', width: '100%', backgroundColor: 'var(--gray-3)' }}>
        <SortableDataGrid
          columns={columns}
          rows={currentRows}
          rowKeyGetter={(row) => row.openhomeId}
          tableRef={tableContainerRef}
          style={{ borderLeft: 'none' }}
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
          onSelectedRowsChange={(ids) => forceSetSelectedIds(ids as Set<OhpkmIdentifier>)}
          onScrolledToBottom={fetchMoreOnBottomReached}
          fetching={isFetching ? 'next' : undefined}
          shouldLoadMore={currentRows.length < totalRowCount}
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

type SelectionController = ReturnType<typeof useSelectedMons>

function useContextMenu(
  findSaveForMon: (identifier: string) => Promise<SAV | undefined>,
  findSavesForAllMons: () => Promise<void>,
  selectionController: SelectionController
) {
  const navigate = useNavigate()
  const { switchBoxCurrentBank, findHomeLocation } = useBanksAndBoxes()
  const { releaseMonsById } = useSaves()
  const { selectedIds, deselectIds } = selectionController

  const buildContextElements = useCallback(
    (mon: OhpkmRowData) => {
      const homeLocation = findHomeLocation(mon.openhomeId)
      const actions: CtxMenuElementBuilder[] = [
        Label.mon(mon),
        homeLocation
          ? Item.label('Jump to Box').action(() => {
              switchBoxCurrentBank(homeLocation.box)
              navigate('/home')
            })
          : Item.label('Find Containing Save').action(() => findSaveForMon(mon.openhomeId)),
        Item.label(`Move To Release Area`).action(() => {
          releaseMonsById(mon.openhomeId)
          deselectIds(mon.openhomeId)
        }),
      ]

      if (selectedIds.size > 0) {
        actions.push(
          Separator,
          Label.label(`Bulk Actions (${selectedIds.size} selected)`),
          Item.label(`Move Selected To Release Area`).action(() => {
            releaseMonsById(...selectedIds)
            deselectIds(...selectedIds)
          })
        )
      }
      actions.push(
        Separator,
        Label.label(`For All Tracked`),
        Item.label('Recover Missing Pokémon...').action(findSavesForAllMons)
      )
      return actions
    },
    [
      deselectIds,
      findHomeLocation,
      findSaveForMon,
      findSavesForAllMons,
      navigate,
      releaseMonsById,
      selectedIds,
      switchBoxCurrentBank,
    ]
  )
  return { buildContextElements }
}
