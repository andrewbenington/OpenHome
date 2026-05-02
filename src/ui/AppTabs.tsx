import { Separator } from '@base-ui/react/separator'
import useIsDev from '@openhome-ui/hooks/isDev'
import { Badge, Box, Flex, ThemePanel } from '@radix-ui/themes'
import { PropsWithChildren, useContext } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { AppTabIconsActive, AppTabIconsInactive } from './components/Icons'
import { Tabs } from './components/Tabs'
import AppStateDisplay from './pages/AppStateDisplay'
import ComponentDebugDisplay from './pages/ComponentDebugDisplay'
import Home from './pages/home/Home'
import PluginsPage from './pages/plugins/Plugins'
import PokedexDisplay from './pages/pokedex/PokedexDisplay'
import Settings from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemonPage from './pages/tracked/TrackedPokemonPage'
import { PluginContext } from './state/plugin/reducer'

export default function AppTabs() {
  const isDev = useIsDev()

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
          <Tabs.Tab value="settings">
            <AppTabIconsActive.Settings />
            <AppTabIconsInactive.Settings />
            Settings
          </Tabs.Tab>
          {isDev && (
            <>
              <Tabs.Tab value="state">
                <AppTabIconsActive.AppState />
                <AppTabIconsInactive.AppState />
                App State
              </Tabs.Tab>
              <Tabs.Tab value="component-debug">
                <AppTabIconsActive.ComponentDebug />
                <AppTabIconsInactive.ComponentDebug />
                Component Debug
              </Tabs.Tab>
            </>
          )}
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
              <Route path="/pokedex" element={<PokedexDisplay />} />
              <Route path="/plugins/*" element={<PluginsPage />} />
              <Route path="/settings/*" element={<Settings />} />
              {isDev && (
                <>
                  <Route path="/state" element={<AppStateDisplay />} />
                  <Route path="/component-debug" element={<ComponentDebugDisplay />} />
                </>
              )}
            </Routes>
            {isDev && (
              <>
                <Tabs.Panel value="state">
                  <AppStateDisplay />
                </Tabs.Panel>
                <Tabs.Panel value="theme">
                  <ThemePanel />
                </Tabs.Panel>
              </>
            )}
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
