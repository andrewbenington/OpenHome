import { createContext } from 'react'

export const SideTabsContext = createContext<[string, (val: string) => void]>(['', () => {}])
