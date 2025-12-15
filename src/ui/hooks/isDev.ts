import { BackendContext } from '@openhome-ui/backend/backendContext'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useState } from 'react'

export default function useIsDev(): boolean {
  const [isDev, setIsDev] = useState<boolean>(false)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then((state) => {
      if (E.isRight(state)) {
        setIsDev(state.right.is_dev)
      }
    })
  }, [backend])

  return isDev
}
