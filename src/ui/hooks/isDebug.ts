import { R } from '@openhome-core/util/functional'
import useBackend from '@openhome-ui/backend/useBackend'
import { useEffect, useState } from 'react'

export default function useIsDebug(): boolean {
  const [isDebug, setIsDebug] = useState<boolean>(false)
  const backend = useBackend()

  useEffect(() => {
    backend.getState().then(R.map((state) => setIsDebug(state.is_dev)))
  }, [backend])

  return isDebug
}
