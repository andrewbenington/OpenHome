import { Sheet, Tab, TabList, TabPanel, Tabs, useTheme } from '@mui/joy'
import useIsDev from '../hooks/isDev'
import AppStateDisplay from './dev/AppStateDisplay'
import ThemeDisplay from './dev/ThemeDisplay'
import Home from './Home'
import TrackedPokemon from './manage/TrackedPokemon'
import Settings from './Settings'
import SortPokemon from './sort/SortPokemon'

export default function AppTabs() {
  const isDev = useIsDev()
  const { palette } = useTheme()

  return (
    <Tabs
      defaultValue="home"
      style={{
        height: '100vh',
        width: '100%',
        background: palette.background.gradient,
      }}
      color="primary"
    >
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
        <>
          <TabPanel sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }} value="state">
            <AppStateDisplay />
          </TabPanel>
          <TabPanel sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }} value="theme">
            <ThemeDisplay />
          </TabPanel>
        </>
      )}
      <Sheet>
        <TabList className="tab-row" color="primary" variant="plain">
          <Tab indicatorPlacement="top" value="home" color="primary" variant="plain">
            Home
          </Tab>
          <Tab indicatorPlacement="top" value="manage" color="primary" variant="plain">
            Tracked Pokémon
          </Tab>
          <Tab indicatorPlacement="top" value="sort" color="primary" variant="plain">
            Sort Pokémon
          </Tab>
          <Tab indicatorPlacement="top" value="settings" color="primary" variant="plain">
            Settings
          </Tab>
          {isDev && (
            <>
              <Tab indicatorPlacement="top" value="state" color="neutral" variant="plain">
                App State
              </Tab>
              <Tab indicatorPlacement="top" value="theme" color="neutral" variant="plain">
                Themes Display
              </Tab>
            </>
          )}
        </TabList>
      </Sheet>
    </Tabs>
  )
}
