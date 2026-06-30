import { useContext } from 'react'
import { BackendContext } from '.'

export default function useBackend() {
  const backend = useContext(BackendContext)

  if (backend === null) {
    throw new Error('Backend has not been loaded')
  }

  return backend
}
