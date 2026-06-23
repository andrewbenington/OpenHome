import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ReactNode, useContext, useEffect, useState } from 'react'

export type DebugOnlyProps = {
  children?: ReactNode
}

export default function DebugOnly(props: DebugOnlyProps) {
  return useIsDebug() ? props.children : undefined
}

function useIsDebug(): boolean {
  const [isDebug, setIsDebug] = useState<boolean>(false)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then(R.map((state) => setIsDebug(state.is_dev)))
  }, [backend])

  return isDebug
}
