/* eslint-disable react-refresh/only-export-components */
import { useContext, useState } from 'react'
import { SideTabsContext } from './SideTabsContext'
import './style.css'

export type SideTabsProps = {
  defaultValue: string
  children: React.ReactNode
}

function SideTabsRoot(props: SideTabsProps) {
  const { defaultValue, children } = props
  const [value, setValue] = useState(defaultValue)

  return (
    <SideTabsContext.Provider value={[value, setValue]}>
      <div className="side-tabs">{children}</div>
    </SideTabsContext.Provider>
  )
}

export type SideTabProps = {
  value: string
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
  value: string
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
