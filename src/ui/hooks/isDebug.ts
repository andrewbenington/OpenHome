import { R } from '@openhome-core/util/functional'
import { AppBackend } from '@openhome-ui/backend'
import { useEffect, useState } from 'react'

export default function useIsDebug(): boolean {
  const [isDebug, setIsDebug] = useState<boolean>(false)

  useEffect(() => {
    AppBackend.getState().then(R.map((state) => setIsDebug(state.is_dev)))
  }, [])

  return isDebug
}
