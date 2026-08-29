import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
import { useCallback, useEffect, useState } from 'react'
import { OhpkmBatchLookupResults, useOhpkmStore } from './useOhpkmStore'

export type OhpkmBatchLookupState = {
  loading: boolean
  batchResults?: OhpkmBatchLookupResults
}

export default function useOhpkmIdBatchLookup(
  openhomeIds: OhpkmIdentifier[]
): OhpkmBatchLookupState {
  const [loading, setLoading] = useState(false)
  const ohpkmStore = useOhpkmStore()
  const [batchResults, setBatchResults] = useState<Option<OhpkmBatchLookupResults>>()

  const loadMons = useCallback(async () => {
    if (!loading && !batchResults) {
      setLoading(true)

      const result = await ohpkmStore.tryLoadBatch(openhomeIds)
      setBatchResults(result)

      setLoading(false)
    }
  }, [batchResults, loading, ohpkmStore, openhomeIds])

  useEffect(() => {
    if (!loading && !batchResults) {
      loadMons()
    }
  }, [batchResults, loadMons, loading])

  return { loading, batchResults }
}
