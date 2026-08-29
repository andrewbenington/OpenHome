import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
import { useState } from 'react'
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

  async function loadMons() {
    if (!loading && !batchResults) {
      setLoading(true)

      const result = await ohpkmStore.tryLoadBatch(openhomeIds)
      setBatchResults(result)

      setLoading(false)
    }
  }

  if (!loading && !batchResults) {
    loadMons()
  }

  return { loading, batchResults }
}
