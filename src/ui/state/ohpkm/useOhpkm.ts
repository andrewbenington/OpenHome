import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
import { useState } from 'react'
import { OhpkmLookupResult, useOhpkmStore } from './useOhpkmStore'

export type OhpkmLookupState = {
  loading: boolean
  ohpkmResult?: OhpkmLookupResult
}

export default function useOhpkm(openhomeId: OhpkmIdentifier): OhpkmLookupState {
  const [loading, setLoading] = useState(false)
  const ohpkmStore = useOhpkmStore()
  const [ohpkmResult, setOhpkmResult] = useState<Option<OhpkmLookupResult>>()

  async function loadMon() {
    if (!loading && !ohpkmResult) {
      setLoading(true)

      const result = await ohpkmStore.tryLoadFromId(openhomeId)
      setOhpkmResult(result)

      setLoading(false)
    }
  }

  if (!loading && !ohpkmResult) {
    loadMon()
  }

  return {
    loading,
    ohpkmResult,
  }
}
