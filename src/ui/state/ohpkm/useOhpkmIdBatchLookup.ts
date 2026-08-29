import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
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
  const openhomeIdsKey = openhomeIds.toSorted().join('~')

  useEffect(() => {
    // if this effect is cleaned up before the results return, the ignore flag tells the callback that it is outdated and should set the results
    let ignore = false
    setLoading(true)
    setBatchResults(undefined)

    loadBatch().then((result) => {
      if (!ignore) {
        setBatchResults(result)
        setLoading(false)
      }
    })

    return () => {
      ignore = true
    }
  }, [openhomeIdsKey])

  return { loading, batchResults }
}
