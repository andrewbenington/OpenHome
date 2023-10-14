import { createTheme, ThemeProvider } from '@mui/material/styles'
import './App.css'
import Home from './Home'
import Themes from './Themes'

const theme = createTheme({
  palette: {
    primary: {
      main: '#A9CEF4',
    },
    secondary: {
      main: '#a6bf8f',
    },
    text: {
      primary: '#000',
      secondary: '#FFF',
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        select: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: Themes[0].backgroundColor,
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Home />
    </ThemeProvider>
  )
}

export default App
