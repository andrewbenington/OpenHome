import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option, R } from '@openhome-core/util/functional'
import { isThenable } from '@openhome-core/util/promise'
import { useDisplayError } from '@openhome-ui/hooks/displayError'
import { useEffect, useEffectEvent, useState } from 'react'
import { OhpkmBatchLookupResults, useOhpkmStore } from './useOhpkmStore'

export type OhpkmBatchLookupState = {
  loading: boolean
  batchResults?: OhpkmBatchLookupResults
}

export default function useOhpkmIdBatchLookup(
  openhomeIds: OhpkmIdentifier[]
): OhpkmBatchLookupState {
  const [loading, setLoading] = useState(true)
  const ohpkmStore = useOhpkmStore()
  const [batchResults, setBatchResults] = useState<Option<OhpkmBatchLookupResults>>()

  const loadBatch = useEffectEvent(() => ohpkmStore.tryLoadBatch(openhomeIds))
  const subscribeOhpkmUpdates = useEffectEvent(ohpkmStore.subscribeAllUpdates)
  const openhomeIdsKey = openhomeIds.join()
  const displayError = useEffectEvent(useDisplayError())

  useEffect(() => {
    // if this effect is cleaned up before the results return, the ignore flag tells the callback that it is outdated and should set the results
    let ignore = false
    setLoading(true)

    const batchResult = loadBatch()
    if (isThenable(batchResult)) {
      batchResult
        .then((result) => {
          if (!ignore) {
            setBatchResults(result)
            setLoading(false)
          }
        })
        .catch((error) => displayError('Error loading OHPKM batch', `Error: '${error}'`))
    } else {
      setBatchResults(batchResult)
      setLoading(false)
    }

    return () => {
      ignore = true
    }
  }, [openhomeIdsKey])

  useEffect(() => {
    if (!batchResults) return

    // if this effect is cleaned up before the results return, the ignore flag tells the callback that it is outdated and should set the results
    let ignore = false
    setLoading(true)

    const cancel = subscribeOhpkmUpdates((id, ohpkm) => {
      if (ignore) return

      const newResults = new Map(batchResults)
      newResults.set(id, ohpkm ? R.Ok(ohpkm) : R.Err({ identifier: id }))
      setBatchResults(newResults)
    })

    return () => {
      ignore = true
      cancel()
    }
  }, [batchResults, openhomeIdsKey])

  return { loading, batchResults }
}
