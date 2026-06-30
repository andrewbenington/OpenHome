import { useContext } from 'react'
import { BackendContext } from './backendContext'

export default function useBackend() {
  const backend = useContext(BackendContext)

  return backend
}
