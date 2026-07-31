import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import { stringSorter } from '@openhome-core/util/sort'
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
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
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

  const keyGetter = (row: NoInfer<OHPKM>): string => {
    return row.openhomeId
  }

  return (
    <OpenHomeCtxMenu
      elements={contextMenuBuilders}
      onOpenChange={(open: boolean) => {
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
