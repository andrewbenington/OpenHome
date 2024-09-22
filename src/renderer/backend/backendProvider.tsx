import { createContext, PropsWithChildren } from 'react'
import BackendInterface from './backendInterface'
import DummyBackend from './dummyBackend'

export type BackendProviderProps = { backend: BackendInterface } & PropsWithChildren

export const BackendContext = createContext<BackendInterface>(DummyBackend)

export function BackendProvider({ backend, children }: BackendProviderProps) {
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>
}
