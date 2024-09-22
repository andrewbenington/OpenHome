import { Box, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy'
import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import { useMemo } from 'react'
import 'react-data-grid/lib/styles.css'
import { BackendProvider } from '../backend/backendProvider'
import { ElectronBackend } from '../backend/electronBackend'
import useIsDarkMode from '../hooks/dark-mode'
import { FilterProvider } from '../state/filter'
import { LookupProvider } from '../state/lookup'
import { OpenSavesProvider } from '../state/saves'
import './App.css'
import { FileStructurePage } from './file_structure/FileStructure'
import Home from './Home'
import ManagePokemon from './manage/ManagePokemon'
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

  const loading = false
  return (
    <ThemeProvider theme={theme}>
      <BackendProvider backend={ElectronBackend}>
        <LookupProvider>
          <OpenSavesProvider>
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
                    <ManagePokemon />
                  </TabPanel>
                  <TabPanel sx={{ '--Tabs-spacing': 0, height: 0 }} value="sort">
                    <SortPokemon />
                  </TabPanel>
                  <TabPanel sx={{ '--Tabs-spacing': 0, height: 0 }} value="schemas">
                    <FileStructurePage />
                  </TabPanel>
                  <TabList color="primary">
                    <Tab indicatorPlacement="top" value="home" color="primary">
                      Home
                    </Tab>
                    <Tab indicatorPlacement="top" value="manage" color="primary">
                      Manage Pokémon
                    </Tab>
                    <Tab indicatorPlacement="top" value="sort" color="primary">
                      Sort Pokémon
                    </Tab>
                    <Tab indicatorPlacement="top" value="schemas" color="primary">
                      File Structures
                    </Tab>
                  </TabList>
                </Tabs>
              )}
            </FilterProvider>
          </OpenSavesProvider>
        </LookupProvider>
      </BackendProvider>
    </ThemeProvider>
  )
}

export default App
