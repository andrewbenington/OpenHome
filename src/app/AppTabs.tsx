import { Tab, TabList, TabPanel, Tabs } from '@mui/joy'
import useIsDev from '../hooks/isDev'
import AppStateDisplay from './AppStateDisplay'
import Home from './Home'
import TrackedPokemon from './manage/TrackedPokemon'
import Settings from './Settings'
import SortPokemon from './sort/SortPokemon'

export default function AppTabs() {
  const isDev = useIsDev()
  return (
    <Tabs defaultValue="home" style={{ height: '100vh', width: '100%' }} color="primary">
      <TabPanel
        sx={{ '--Tabs-spacing': 0, height: 0 }}
        value="home"
        // container
      >
        <Home />
      </TabPanel>
      <TabPanel sx={{ '--Tabs-spacing': 0, height: 0 }} value="manage">
        <TrackedPokemon />
      </TabPanel>
      <TabPanel sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }} value="sort">
        <SortPokemon />
      </TabPanel>
      <TabPanel sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }} value="settings">
        <Settings />
      </TabPanel>
      {isDev && (
        <TabPanel sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }} value="state">
          <AppStateDisplay />
        </TabPanel>
      )}
      <TabList color="primary">
        <Tab indicatorPlacement="top" value="home" color="primary">
          Home
        </Tab>
        <Tab indicatorPlacement="top" value="manage" color="primary">
          Tracked Pokémon
        </Tab>
        <Tab indicatorPlacement="top" value="sort" color="primary">
          Sort Pokémon
        </Tab>
        <Tab indicatorPlacement="top" value="settings" color="primary">
          Settings
        </Tab>
        {isDev && (
          <Tab indicatorPlacement="top" value="state" color="primary">
            App State
          </Tab>
        )}
      </TabList>
    </Tabs>
  )
}
