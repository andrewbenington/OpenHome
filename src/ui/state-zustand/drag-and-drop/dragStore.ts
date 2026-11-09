import { PkmFormSpecifiers } from '@openhome-core/pkm/util/pkmInterface'
import { SAV } from '@openhome-core/save/interfaces'
import { monSupportedBySave } from '@openhome-core/save/util'
import { Option } from '@openhome-core/util/functional'
import { DragPayload } from '@openhome-ui/state/drag-and-drop'
import { useSaves } from '@openhome-ui/state/saves'
import { useCallback } from 'react'
import { create } from 'zustand'

export const useDragStore = create<{ payload?: DragPayload; overId?: string }>(() => ({}))

export const useIsDraggingActive = () => useDragStore((s) => Boolean(s.payload))

export const useIsDraggingOver = (dropID?: string) =>
  useDragStore((s) => dropID !== undefined && s.overId === dropID)

export function useCanSwapWithDragging(save: SAV) {
  const { saveFromIdentifier } = useSaves()
  const payload = useDragStore((s) => s.payload)

  return useCallback(
    (displacedMon: Option<PkmFormSpecifiers>) => {
      if (!payload) return true

      if (payload.kind === 'item') {
        return save.supportsItem(payload.item.index)
      }

      const draggingMons = Array.isArray(payload.monData) ? payload.monData : [payload.monData]

      for (const monWithLocation of draggingMons) {
        const sourceSave = monWithLocation.isHome
          ? undefined
          : saveFromIdentifier(monWithLocation.saveIdentifier)

        const sourceIsOpenHome = !sourceSave
        if (!monSupportedBySave(save, monWithLocation.mon)) return false
        if (displacedMon && !sourceIsOpenHome && !monSupportedBySave(sourceSave, displacedMon)) {
          return false
        }
      }

      return true
    },
    [payload, save, saveFromIdentifier]
  )
}

export function useDragSourceSupportsMon() {
  const { saveFromIdentifier } = useSaves()
  const payload = useDragStore((s) => s.payload)

  return useCallback(
    (mon: PkmFormSpecifiers) => {
      if (!payload) return true

      if (!payload || payload.kind === 'item') return true
      if (payload.kind === 'mon') {
        return payload.monData.isHome
          ? true
          : monSupportedBySave(saveFromIdentifier(payload.monData.saveIdentifier), mon)
      }

      return payload.monData.every(
        (monWithLocation) =>
          monWithLocation.isHome ||
          monSupportedBySave(saveFromIdentifier(monWithLocation.saveIdentifier), mon)
      )
    },
    [payload, saveFromIdentifier]
  )
}

export const useDraggingActive = () => useDragStore((s) => s.payload !== undefined)
