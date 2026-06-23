import { Separator } from '@base-ui/react/separator'
import { Badge, Box, Flex, ThemePanel } from '@radix-ui/themes'
import { PropsWithChildren, useContext } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import DebugOnly from './components/DebugOnly'
import { AppTabIconsActive, AppTabIconsInactive } from './components/Icons'
import { Tabs } from './components/Tabs'
import AppStateDisplay from './pages/AppStateDisplay'
import DebugDisplay from './pages/DebugDisplay'
import Home from './pages/home/Home'
import LogsPage from './pages/logs/LogsPage'
import PluginsPage from './pages/plugins/Plugins'
import PokedexPage from './pages/pokedex/PokedexPage'
import Settings from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemonPage from './pages/tracked/TrackedPokemonPage'
import { PluginContext } from './state/plugin/reducer'

export default function AppTabs() {
  const tab = useLocation().pathname.split('/')[1] || 'home'
  const navigate = useNavigate()
  const { outdatedPluginCount } = useContext(PluginContext)

  const homeElement = <Home />

  return (
    <Tabs.Root
      value={tab}
      style={{ height: '100vh' }}
      orientation="vertical"
      onValueChange={(tab) => navigate(tab)}
    >
      <Flex style={{ height: '100vh' }}>
        <Tabs.IconList className="tab-sidebar">
          <Tabs.Tab value="home">
            <AppTabIconsActive.Home />
            <AppTabIconsInactive.Home />
            Home
          </Tabs.Tab>
          <Tabs.Tab value="manage">
            <AppTabIconsActive.Tracked />
            <AppTabIconsInactive.Tracked />
            Tracked
          </Tabs.Tab>
          <Tabs.Tab value="sort">
            <AppTabIconsActive.List />
            <AppTabIconsInactive.List />
            List
          </Tabs.Tab>
          <Tabs.Tab value="pokedex">
            <AppTabIconsActive.Pokedex />
            <AppTabIconsInactive.Pokedex />
            Pokédex
          </Tabs.Tab>
          <Tabs.Tab value="plugins">
            <NotificationBadge count={outdatedPluginCount}>
              <AppTabIconsActive.Plugins />
              <AppTabIconsInactive.Plugins />
              Sprite Plugins
            </NotificationBadge>
          </Tabs.Tab>
          <Tabs.Tab value="logs">
            <AppTabIconsActive.Logs />
            <AppTabIconsInactive.Logs />
            Logs
          </Tabs.Tab>
          <Tabs.Tab value="settings">
            <AppTabIconsActive.Settings />
            <AppTabIconsInactive.Settings />
            Settings
          </Tabs.Tab>
          <DebugOnly>
            <Tabs.Tab value="state">
              <AppTabIconsActive.AppState />
              <AppTabIconsInactive.AppState />
              App State
            </Tabs.Tab>
            <Tabs.Tab value="component-debug">
              <AppTabIconsActive.ComponentDebug />
              <AppTabIconsInactive.ComponentDebug />
              Visual Debug
            </Tabs.Tab>
          </DebugOnly>
          <Tabs.Indicator />
        </Tabs.IconList>
        <Separator className="Separator" orientation="vertical" />
        <Box style={{ flex: 1, width: '100%', height: '100%', overflowY: 'hidden' }}>
          <div style={{ height: '100%' }}>
            <Routes>
              <Route index path="/" element={homeElement} />
              <Route path="/home" element={homeElement} />
              <Route path="/manage/*" element={<TrackedPokemonPage />} />
              <Route path="/sort" element={<SortPokemon />} />
              <Route path="/pokedex" element={<PokedexPage />} />
              <Route path="/plugins/*" element={<PluginsPage />} />
              <Route path="/logs/*" element={<LogsPage />} />
              <Route path="/settings/*" element={<Settings />} />
              <DebugOnly>
                <Route path="/state" element={<AppStateDisplay />} />
                <Route path="/component-debug" element={<DebugDisplay />} />
              </DebugOnly>
            </Routes>
            <DebugOnly>
              <Tabs.Panel value="state">
                <AppStateDisplay />
              </Tabs.Panel>
              <Tabs.Panel value="theme">
                <ThemePanel />
              </Tabs.Panel>
            </DebugOnly>
          </div>
        </Box>
      </Flex>
    </Tabs.Root>
  )
}

type NotificationBadgeProps = PropsWithChildren & { count?: number }

function NotificationBadge(props: NotificationBadgeProps) {
  const { count, children } = props
  return count ? (
    <div style={{ position: 'relative' }}>
      <Badge
        radius="full"
        variant="solid"
        style={{ position: 'absolute', top: '-0.5rem', right: 0 }}
      >
        {count}
      </Badge>
      {children}
    </div>
  ) : (
    children
  )
}
