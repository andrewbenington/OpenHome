import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option, R, range } from '@openhome-core/util/functional'
import {
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import useOhpkmBatchIdLookup from '@openhome-ui/state/ohpkm/useOhpkmIdBatchLookup'
import { EMPTY_SLOT, HomeMonLocation, useSaves } from '@openhome-ui/state/saves'
import { useMemo } from 'react'
import { BoxSlotResult } from './BoxCellAsync'

type SlotData = {
  monPromise: Option<BoxSlotResult>
  location: HomeMonLocation
  identifier: Option<OhpkmIdentifier>
  loading?: boolean
}

export function useCurrentHomeBox() {
  const { getPendingMon } = useSaves()
  const { getCurrentBox, getCurrentBank } = useBanksAndBoxes()

  const currentBox = getCurrentBox()

  const currentBankIndex = getCurrentBank().index
  const currentBoxIndex = currentBox.index

  const { batchResults: ohpkmsById, loading } = useOhpkmBatchIdLookup(
    Array.from(currentBox.identifiers.values())
  )

  const slots: SlotData[] = useMemo(() => {
    return range(OPENHOME_BOX_SLOTS)
      .map((index: number) => currentBox.identifiers.get(index))
      .map((storedId, index) => {
        const location: HomeMonLocation = {
          bank: currentBankIndex,
          box: currentBoxIndex,
          boxSlot: index,
          isHome: true,
        }

        let identifier = storedId
        let monPromise: BoxSlotResult = R.Ok(undefined) as BoxSlotResult

        // pendingMon means this slot is in the process of being updated, but needs to wait
        // for the OHPKM data to be registered. In the meantime the pendingMon should be displayed
        // for immediate visual feedback
        const pendingMon = getPendingMon(location)
        if (pendingMon === EMPTY_SLOT) {
          identifier = undefined
        } else if (pendingMon) {
          if (typeof pendingMon === 'string') {
            identifier = pendingMon
          } else {
            identifier = undefined
            monPromise = R.Ok(pendingMon) as BoxSlotResult
          }
        }

        if (identifier) {
          const lookupResult = ohpkmsById?.get(identifier)
          monPromise =
            lookupResult ?? (loading ? (R.Ok(undefined) as BoxSlotResult) : R.Err({ identifier }))
        }

        const monPresentButLoading =
          (loading && identifier !== undefined && monPromise !== undefined) ||
          pendingMon !== undefined
        return { monPromise, location, identifier, loading: monPresentButLoading }
      })
  }, [
    currentBankIndex,
    currentBox.identifiers,
    currentBoxIndex,
    getPendingMon,
    ohpkmsById,
    loading,
  ])

  return slots
}
