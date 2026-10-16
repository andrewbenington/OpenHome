import { Separator } from '@base-ui/react/separator'
import { Badge, Box, Flex, ThemePanel } from '@radix-ui/themes'
import { PropsWithChildren, useContext, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { PKM_RS_WASM } from '../init'
import DebugOnly from './components/DebugOnly'
import Fallback from './components/Fallback'
import { AppTabIconsActive, AppTabIconsInactive } from './components/Icons'
import OhoButton from './components/OhoButton'
import OhoFlex from './components/OhoFlex'
import { Tabs } from './components/Tabs'
import useIsDebug from './hooks/isDebug'
import AppStateDisplay from './pages/debug/AppStateDisplay'
import DebugDisplay from './pages/debug/DebugDisplay'
import Home from './pages/home/Home'
import LogsPage from './pages/logs/LogsPage'
import PluginsPage from './pages/plugins/Plugins'
import PokedexPage from './pages/pokedex/PokedexPage'
import SettingsPage from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemonPage from './pages/tracked/TrackedPokemonPage'
import { PluginContext } from './state/plugin/reducer'

function wasmSizeDisplay() {
  return PKM_RS_WASM
    ? (PKM_RS_WASM.memory.buffer.byteLength / 1024 / 1024).toFixed(1) + ' MB'
    : 'loading...'
}

export default function AppTabs() {
  const tab = useLocation().pathname.split('/')[1] || 'home'
  const { outdatedPluginCount } = useContext(PluginContext)
  const [wasmSize, setWasmSize] = useState(wasmSizeDisplay())

  const homeElement = <Home />

  const navigate = useNavigate()

  return (
    <Fallback fatal>
      <Flex style={{ height: '100vh' }} direction="column">
        <Tabs.Root
          value={tab}
          orientation="vertical"
          onValueChange={(tab) => navigate(tab)}
          style={{ flex: 1, maxHeight: 'calc(100vh - var(--footer-height)' }}
        >
          <Flex style={{ height: '100%', flexGrow: 1 }}>
            <Tabs.IconList className="tab-sidebar" direction="column">
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
                <Tabs.Tab value="debug">
                  <AppTabIconsActive.ComponentDebug />
                  <AppTabIconsInactive.ComponentDebug />
                  Debug
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
                  <Route path="/settings/*" element={<SettingsPage />} />
                  {useIsDebug() && (
                    <>
                      <Route path="/state" element={<AppStateDisplay />} />
                      <Route path="/component-debug" element={<DebugDisplay />} />
                    </>
                  )}
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
        <DebugOnly>
          <div className="modal-footer">
            <OhoFlex.Spacer />
            <p style={{ fontSize: '0.8rem' }}>WASM memory usage:</p>
            <code>{wasmSize}</code>
            <OhoButton
              size="1"
              onClick={() => setWasmSize(wasmSizeDisplay())}
              style={{ fontSize: '0.7rem', padding: '0.15rem', height: 'fit-content' }}
            >
              Refresh
            </OhoButton>
          </div>
        </DebugOnly>
      </Flex>
    </Fallback>
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
