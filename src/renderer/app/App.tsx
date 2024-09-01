import { createTheme, ThemeProvider } from '@mui/material/styles'
import { useMemo } from 'react'
import 'react-data-grid/lib/styles.css'
import useIsDarkMode from '../hooks/dark-mode'
import { FilterProvider } from '../state/filter'
import './App.css'
import Home from './Home'
import { darkTheme, lightTheme } from './Themes'

function App() {
  const isDarkMode = useIsDarkMode()
  const theme = useMemo(() => createTheme(isDarkMode ? darkTheme : lightTheme), [isDarkMode])
  return (
    <ThemeProvider theme={theme}>
      <FilterProvider>
        <Home />
      </FilterProvider>
    </ThemeProvider>
  )
}

export default App
