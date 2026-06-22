import { usePathSegment } from '@openhome-ui/hooks/routing'
import { ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import SideTabs from './SideTabs'

type RouteData = {
  uniqueKey: string
  display: string
  component: ReactNode
}

export type SideTabNavigationProps = {
  defaultTab: string
  parentPathSegment: string
  routes: RouteData[]
  children?: ReactNode
}

export default function SideTabNavigation(props: SideTabNavigationProps) {
  const { defaultTab, routes, parentPathSegment, children } = props
  const { currentSegment, setCurrentSegment } = usePathSegment(parentPathSegment, defaultTab)

  const defaultRoute = routes.find((r) => r.uniqueKey === defaultTab)

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        {routes.map(({ uniqueKey, display }) => (
          <SideTabs.Tab key={uniqueKey} value={uniqueKey}>
            {display}
          </SideTabs.Tab>
        ))}
        <div style={{ flex: 1 }} />
        {children}
      </SideTabs.TabList>
      <Routes>
        {defaultRoute && <Route index path="" element={defaultRoute.component} />}
        {routes.map(({ uniqueKey, component }) => (
          <Route key={uniqueKey} path={uniqueKey} element={component} />
        ))}
      </Routes>
    </SideTabs.Root>
  )
}
