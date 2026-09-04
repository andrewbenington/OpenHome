import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { PaginationCursor } from '@openhome-core/tauri/spectaCommands'
import { $R, Option, R } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import { filterUndefined } from '@openhome-core/util/sort'
import useOhpkmColumns from '@openhome-ui/columns/ohpkm'
import {
  CtxMenuElementBuilder,
  Item,
  Label,
  OpenHomeCtxMenu,
  Separator,
} from '@openhome-ui/components/context-menu'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useBanksAndBoxes } from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { Spinner } from '@radix-ui/themes'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCreateAtom } from '@tanstack/react-store'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import './style.css'

export type AllTrackedPokemonProps = {
  onSelectMon: (openhomeId: OhpkmIdentifier) => void
  findSaveForMon: (identifier: string) => Promise<SAV | undefined>
  findSavesForAllMons: () => Promise<void>
}

export default function AllTrackedPokemonRdg({
  onSelectMon,
  findSaveForMon,
  findSavesForAllMons,
}: AllTrackedPokemonProps) {
  const paginationAtom = useCreateAtom<PaginationCursor>({
    pageIndex: 0, // initial page index
    pageSize: 100, // default page size
  })
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()
  const { findHomeLocation } = useBanksAndBoxes()
  const selectionController = useSelectedMons()
  const { selectedIds, deselectIds } = selectionController
  const [contextMenuBuilders, setContextMenuBuilders] = useState<Option<CtxMenuElementBuilder>[]>(
    []
  )
  const [ctxMenuMonId, setCtxMenuMonId] = useState<Option<OhpkmIdentifier>>()
  const { releaseMonsById, trackedMonsToRelease } = saves
  const columns = useOhpkmColumns(trackedMonsToRelease, onSelectMon)
  const navigate = useNavigate()
  const { switchBoxCurrentBank } = useBanksAndBoxes()
  const tableContainerRef = useRef<HTMLDivElement>(null) // for listening to scroll

  const buildContextElements = useCallback(
    (mon: OHPKM) => {
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

  const { data, fetchNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: [
      'all-tracked',
      'cursor',
      paginationAtom.get().pageIndex,
      paginationAtom.get().pageSize,
      'sorting',
      'globalFilter',
    ],
    queryFn: async (d) => {
      const pageParam = paginationAtom.get() ?? d.pageParam
      return await ohpkmStore.searchStore(pageParam, [])
    },
    initialPageParam: { pageIndex: 0, pageSize: 300 },
    getNextPageParam: (lastPage) => {
      return $R(lastPage).match(
        (page) => page.nextCursor,
        (e) => {
          console.error(e)
          return paginationAtom.get()
        }
      )
    },
  })

  // flatten the array of arrays from the useInfiniteQuery hook
  const flatData = useMemo(() => {
    return (
      data?.pages
        .flatMap(R.ok)
        .filter(filterUndefined)
        .flatMap((page) => page.results) ?? []
    )
  }, [data])

  const totalDBRowCount = $O(data?.pages[0])
    .flatMap(R.ok)
    .map((page) => page.totalCount)
    .orElse(0)
  const totalFetched = flatData.length

  // called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = async () => {
    if (!tableContainerRef.current || isFetching || totalFetched >= totalDBRowCount) {
      return
    }
    await fetchNextPage()
  }

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
          rows={flatData}
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
          onSelectedRowsChange={(ids) =>
            selectionController.forceSetSelectedIds(ids as Set<OhpkmIdentifier>)
          }
          paginationAtom={paginationAtom}
          onScrolledToBottom={fetchMoreOnBottomReached}
          fetching={isFetching ? 'next' : undefined}
          shouldLoadMore={flatData.length < totalDBRowCount}
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
