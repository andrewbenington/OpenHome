import { usePathSegment } from '@openhome-ui/hooks/routing'
import { ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import SideTabs from './SideTabs'

type RouteData = {
  route: string
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

  const defaultRoute = routes.find((r) => r.route === defaultTab)

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        {routes.map(({ route, display }) => (
          <SideTabs.Tab key={route} value={route}>
            {display}
          </SideTabs.Tab>
        ))}
        <div style={{ flex: 1 }} />
        {children}
      </SideTabs.TabList>
      <div className="side-tab-panel">
        <Routes>
          {defaultRoute && <Route index path={``} element={defaultRoute.component} />}
          {routes.map(({ route, component }) => {
            return <Route key={route} path={`${route}/*`} element={component} />
          })}
        </Routes>
      </div>
    </SideTabs.Root>
  )
}
