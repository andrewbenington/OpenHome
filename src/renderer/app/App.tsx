import { Box, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy'
import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import { useMemo, useReducer } from 'react'
import 'react-data-grid/lib/styles.css'
import { SaveType } from 'src/types/types'
import { BackendProvider } from '../backend/backendProvider'
import { ElectronBackend } from '../backend/electronBackend'
import useIsDarkMode from '../hooks/dark-mode'
import { AppInfoContext, appInfoReducer } from '../state/appInfo'
import { FilterProvider } from '../state/filter'
import { LookupProvider } from '../state/lookup'
import { MouseContext, mouseReducer } from '../state/mouse'
import { OpenSavesContext, openSavesReducer } from '../state/openSaves'
import './App.css'
import Home from './Home'
import TrackedPokemon from './manage/TrackedPokemon'
import SortPokemon from './sort/SortPokemon'
import { components, darkTheme, lightTheme } from './Themes'

function App() {
  const isDarkMode = useIsDarkMode()
  const theme = useMemo(
    () =>
      extendTheme({
        colorSchemes: {
          dark: isDarkMode ? darkTheme : lightTheme,
          light: isDarkMode ? darkTheme : lightTheme,
        },
        components,
      }),
    [isDarkMode]
  )
  const [mouseState, mouseDispatch] = useReducer(mouseReducer, { shift: false })
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, {})
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    modifiedOHPKMs: {},
    monsToRelease: [],
    openSaves: {},
  })

  const loading = false

  return (
    <ThemeProvider theme={theme}>
      <BackendProvider backend={ElectronBackend}>
        <AppInfoContext.Provider value={[appInfoState, appInfoDispatch]}>
          <MouseContext.Provider value={[mouseState, mouseDispatch]}>
            <LookupProvider>
              <OpenSavesContext.Provider
                value={[
                  openSavesState,
                  openSavesDispatch,
                  Object.values(openSavesState.openSaves)
                    .filter((data) => !!data)
                    .filter((data) => data.save.saveType !== SaveType.OPENHOME)
                    .sort((a, b) => a.index - b.index)
                    .map((data) => data.save),
                ]}
              >
                <FilterProvider>
                  {loading ? (
                    <Box width="100%" height="100%" display="grid">
                      <Typography margin="auto" fontSize={40} fontWeight="bold">
                        OpenHome
                      </Typography>
                    </Box>
                  ) : (
                    <Tabs
                      defaultValue="home"
                      style={{ height: '100vh', width: '100%' }}
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
                      <TabPanel
                        sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }}
                        value="sort"
                      >
                        <SortPokemon />
                      </TabPanel>
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
                      </TabList>
                    </Tabs>
                  )}
                </FilterProvider>
              </OpenSavesContext.Provider>
            </LookupProvider>
          </MouseContext.Provider>
        </AppInfoContext.Provider>
      </BackendProvider>
    </ThemeProvider>
  )
}

export default App
