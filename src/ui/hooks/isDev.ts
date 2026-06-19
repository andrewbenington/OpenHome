import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { useContext, useEffect, useState } from 'react'

export default function useIsDev(): boolean {
  const [isDev, setIsDev] = useState<boolean>(false)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then(R.map((state) => setIsDev(state.is_dev)))
  }, [backend])

  return isDev
}
