import { createContext } from 'react'
import { Option } from '../../../core/util/functional'

export const SideTabsContext = createContext<[Option<string>, (val: Option<string>) => void]>([
  '',
  () => {},
])
