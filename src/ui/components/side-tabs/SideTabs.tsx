/* eslint-disable react-refresh/only-export-components */
import { Option } from '@openhome-core/util/functional'
import { HTMLAttributes, useContext, useState } from 'react'
import { SideTabsContext } from './SideTabsContext'
import './style.css'

export type SideTabsProps = {
  value?: Option<string>
  onValueChange?: (value: Option<string>) => void
  defaultValue?: Option<string>
  children: React.ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue'>

function SideTabsRoot(props: SideTabsProps) {
  const { className, value, onValueChange, defaultValue, children, ...otherProps } = props
  const [controlledValue, setControllerdValue] = useState(defaultValue)

  const valueToUse = value !== undefined ? value : controlledValue
  const updateValue = (newValue: Option<string>) => {
    if (onValueChange) {
      onValueChange(newValue)
    }
    if (value === undefined) {
      setControllerdValue(newValue)
    }
  }

  return (
    <SideTabsContext.Provider value={[valueToUse, updateValue]}>
      <div className={`side-tabs ${className ?? ''}`} {...otherProps}>
        {children}
      </div>
    </SideTabsContext.Provider>
  )
}

export type SideTabProps = {
  value: Option<string>
  children: React.ReactNode
}

function SideTab(props: SideTabProps) {
  const { value, children } = props
  const [tab, setTab] = useContext(SideTabsContext)

  return (
    <button
      className={`side-tab ${tab === value ? 'side-tab-active' : ''}`}
      onClick={() => setTab(value)}
    >
      {children}
    </button>
  )
}

export type SideTabListProps = {
  children: React.ReactNode
}

function SideTabList(props: SideTabListProps) {
  const { children } = props

  return <div className="side-tab-list">{children}</div>
}

export type SideTabPanelProps = {
  value: Option<string>
  children: React.ReactNode
}

function SideTabsPanel(props: SideTabPanelProps) {
  const { value, children } = props
  const [tab, setTab] = useContext(SideTabsContext)

  return tab === value ? (
    <div className="side-tab-panel" onClick={() => setTab(value)}>
      {children}
    </div>
  ) : (
    <div />
  )
}

export default { Root: SideTabsRoot, Tab: SideTab, TabList: SideTabList, Panel: SideTabsPanel }
