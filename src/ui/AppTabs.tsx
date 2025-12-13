import useIsDev from '@openhome/ui/hooks/isDev'
import { Box, Tabs, ThemePanel } from '@radix-ui/themes'
import AppStateDisplay from './pages/AppStateDisplay'
import Home from './pages/home/Home'
import PluginsPage from './pages/plugins/Plugins'
import PokedexDisplay from './pages/pokedex/PokedexDisplay'
import Settings from './pages/Settings'
import SortPokemon from './pages/sort/SortPokemon'
import TrackedPokemon from './pages/tracked/TrackedPokemon'

export default function AppTabs() {
  const isDev = useIsDev()

  return (
    <Tabs.Root
      defaultValue="home"
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box height="0" flexGrow="1">
        <Tabs.Content value="home">
          <Home />
        </Tabs.Content>
        <Tabs.Content value="manage">
          <TrackedPokemon />
        </Tabs.Content>
        <Tabs.Content value="sort">
          <SortPokemon />
        </Tabs.Content>
        <Tabs.Content value="pokedex">
          <PokedexDisplay />
        </Tabs.Content>
        <Tabs.Content value="plugins">
          <PluginsPage />
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Settings />
        </Tabs.Content>
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
