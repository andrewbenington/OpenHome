import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { Option } from '@openhome-core/util/functional'
import { useState } from 'react'
import { useOhpkmStore } from './useOhpkmStore'

export type OhpkmBatchLoadState = {
  loading: boolean
  monsWithLoadedData: Option<readonly PKMInterface[]>
}

export default function useOhpkmBatchLoad(mons: readonly PKMInterface[]): OhpkmBatchLoadState {
  const [loading, setLoading] = useState(false)
  const ohpkmStore = useOhpkmStore()
  const [monsWithLoadedData, setMonsWithLoadedData] = useState<Option<Readonly<PKMInterface[]>>>()

  async function loadMons() {
    if (!loading && !monsWithLoadedData) {
      setLoading(true)

      const result = await ohpkmStore.monOrOhpkmIfTrackedAll(mons)
      setMonsWithLoadedData(result)

      setLoading(false)
    }
  }

  if (!loading && !monsWithLoadedData) {
    loadMons()
  }

  return { loading, monsWithLoadedData }
}
