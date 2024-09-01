import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import { useMemo } from 'react'
import 'react-data-grid/lib/styles.css'
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
  return (
    <ThemeProvider theme={theme}>
      <FilterProvider>
        <Home />
      </FilterProvider>
    </ThemeProvider>
  )
}

export default App
