import useIsDev from '@openhome-ui/hooks/isDev'
import { Box, Tabs, ThemePanel } from '@radix-ui/themes'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
import AppStateDisplay from './pages/AppStateDisplay'
import Home from './pages/home/Home'
import PluginsPage from './pages/plugins/Plugins'
import PokedexDisplay from './pages/pokedex/PokedexDisplay'
import Settings from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemon from './pages/tracked/TrackedPokemon'

export default function AppTabs() {
  const isDev = useIsDev()

  const tab = useLocation().pathname.split('/')[1] || 'home'
  const navigate = useNavigate()

  const homeElement = <Home />

  return (
    <Tabs.Root
      value={tab}
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onValueChange={(tab) => navigate(tab)}
    >
      <Box height="0" flexGrow="1">
        <Routes>
          <Route index path="/" element={homeElement} />
          <Route path="/home" element={homeElement} />
          <Route path="/manage/*" element={<TrackedPokemon />} />
          <Route path="/sort" element={<SortPokemon />} />
          <Route path="/pokedex" element={<PokedexDisplay />} />
          <Route path="/plugins/*" element={<PluginsPage />} />
          <Route path="/settings" element={<Settings />} />
          {isDev && (
            <>
              <Route path="/state" element={<AppStateDisplay />} />
              <Route path="/theme" element={<ThemePanel />} />
            </>
          )}
        </Routes>
        {isDev && (
          <>
            <Tabs.Content value="state">
              <AppStateDisplay />
            </Tabs.Content>
            <Tabs.Content value="theme">
              <ThemePanel />
            </Tabs.Content>
          </>
        )}
      </Box>
      <Tabs.List className="tab-row">
        <Tabs.Trigger value="home">Home</Tabs.Trigger>
        <Tabs.Trigger value="manage">Tracked Pokémon</Tabs.Trigger>
        <Tabs.Trigger value="sort">Sort Pokémon</Tabs.Trigger>
        <Tabs.Trigger value="pokedex">Pokédex</Tabs.Trigger>
        <Tabs.Trigger value="plugins">Plugins</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        {isDev && (
          <>
            <Tabs.Trigger value="state">App State</Tabs.Trigger>
            <Tabs.Trigger value="theme">Themes Display</Tabs.Trigger>
          </>
        )}
      </Tabs.List>
    </Tabs.Root>
  )
}
