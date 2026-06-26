import { Option } from '@openhome-core/util/functional'
import { createContext } from 'react'

export const SideTabsContext = createContext<[Option<string>, (val: Option<string>) => void]>([
  '',
  () => {},
])
