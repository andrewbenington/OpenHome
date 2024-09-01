import { Box, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy'
import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import { useMemo } from 'react'
import 'react-data-grid/lib/styles.css'
import ManagePokemon from '../components/manage/ManagePokemon'
import useIsDarkMode from '../hooks/dark-mode'
import { FilterProvider } from '../state/filter'
import './App.css'
import Home from './Home'
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
      <FilterProvider>
        {loading ? (
          <Box width="100%" height="100%" display="grid">
            <Typography margin="auto" fontSize={40} fontWeight="bold">
              OpenHome
            </Typography>
          </Box>
        ) : (
          <Tabs defaultValue="home" style={{ height: '100%', width: '100%' }}>
            <TabPanel
              sx={{ '--Tabs-spacing': 0 }}
              value="home"
              // container
            >
              <Home />
            </TabPanel>
            <TabPanel sx={{ '--Tabs-spacing': 0 }} value="manage">
              <ManagePokemon />
            </TabPanel>
            <TabList>
              <Tab indicatorPlacement="top" value="home">
                Home
              </Tab>
              <Tab indicatorPlacement="top" value="manage">
                Manage Pokémon
              </Tab>
            </TabList>
          </Tabs>
        )}
      </FilterProvider>
    </ThemeProvider>
  )
}

export default App
