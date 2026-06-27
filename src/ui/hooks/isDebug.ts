import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useContext, useEffect, useState } from 'react'

export default function useIsDebug(): boolean {
  const [isDebug, setIsDebug] = useState<boolean>(false)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then(R.map((state) => setIsDebug(state.is_dev)))
  }, [backend])

  return isDebug
}
