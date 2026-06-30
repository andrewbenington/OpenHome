import { PropsWithChildren } from 'react'
import { BackendContext } from './backendContext'
import BackendInterface from './backendInterface'

export type BackendProviderProps = {
  backend: BackendInterface
} & PropsWithChildren

export function BackendProvider({ backend, children }: BackendProviderProps) {
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>
}
