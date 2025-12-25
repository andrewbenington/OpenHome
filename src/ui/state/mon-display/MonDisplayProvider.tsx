import { useState } from 'react'
import { OhpkmStoreProviderProps } from '../ohpkm/OhpkmStoreProvider'
import { MonDisplayContext, MonDisplayState, initialMonDisplayState } from './useMonDisplay'

export default function MonDisplayProvider({ children }: OhpkmStoreProviderProps) {
  const [monDisplayState, setMonDisplayState] = useState<MonDisplayState>(initialMonDisplayState())

  return (
    <MonDisplayContext.Provider value={[monDisplayState, setMonDisplayState]}>
      {children}
    </MonDisplayContext.Provider>
  )
}
