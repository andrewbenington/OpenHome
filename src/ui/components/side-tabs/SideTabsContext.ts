import { Option } from '@openhome-core/util/functional'
import { createContext } from 'react'

type Tab = Option<string>

type SetTab = (val: Tab) => void

type QueryKey = Option<string>

export const SideTabsContext = createContext<[Tab, SetTab, QueryKey]>(['', () => {}, undefined])
