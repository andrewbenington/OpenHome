import { Separator } from '@base-ui/react/separator'
import useIsDev from '@openhome-ui/hooks/isDev'
import { Box, Flex, ThemePanel } from '@radix-ui/themes'
import {
  RiFileMarkedFill,
  RiFileMarkedLine,
  RiHome2Fill,
  RiHome2Line,
  RiLayoutGrid2Fill,
  RiLayoutGrid2Line,
} from 'react-icons/ri'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import { Tabs } from './components/Tabs'
import AppStateDisplay from './pages/AppStateDisplay'
import ComponentDebugDisplay from './pages/ComponentDebugDisplay'
import Home from './pages/home/Home'
import PluginsPage from './pages/plugins/Plugins'
import PokedexDisplay from './pages/pokedex/PokedexDisplay'
import Settings from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemonPage from './pages/tracked/TrackedPokemonPage'

export default function AppTabs() {
  const isDev = useIsDev()

  const tab = useLocation().pathname.split('/')[1] || 'home'
  const navigate = useNavigate()

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
            <RiHome2Fill className="active-tab" />
            <RiHome2Line className="inactive-tab" />
            Home
          </Tabs.Tab>
          <Tabs.Tab value="manage">
            <RiFileMarkedFill className="active-tab" />
            <RiFileMarkedLine className="inactive-tab" />
            Tracked
          </Tabs.Tab>
          <Tabs.Tab value="sort">
            <RiLayoutGrid2Fill className="active-tab" />
            <RiLayoutGrid2Line className="inactive-tab" />
            List
          </Tabs.Tab>
          <Tabs.Tab value="pokedex">Pokédex</Tabs.Tab>
          <Tabs.Tab value="plugins">Plugins</Tabs.Tab>
          <Tabs.Tab value="settings">Settings</Tabs.Tab>
          {isDev && (
            <>
              <Tabs.Tab value="state">App State</Tabs.Tab>
              <Tabs.Tab value="component-debug">Component Debug</Tabs.Tab>
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
