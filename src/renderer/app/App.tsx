import { createTheme, ThemeProvider } from '@mui/material/styles'
import { FilterProvider } from '../state/filter'
import './App.css'
import Home from './Home'

// const teal = '#53B4A5'
const lightTeal = '#7DCEAB'
const red = '#BC4749'
const red2 = '#e45454'
// const green = '#84DD63'
// const yellow = '#FFC31F'
const tealGradient = 'linear-gradient(355deg, rgba(83,180,165,1) 0%, rgba(125,206,171,1) 85%)'
// const oldBackground = "#A9CEF4"

const theme = createTheme({
  palette: {
    secondary: {
      main: red,
    },
    primary: {
      main: red2,
    },
    background: {
      default: lightTeal,
      gradient: tealGradient,
      paper: '#dfd',
    },
    text: {
      primary: '#333',
      secondary: '#000',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderWidth: 2,
          ':hover': {
            borderWidth: 2,
          },
        },
      },
    },
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
          background: tealGradient,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        hasClearIcon: {
          '& svg': {
            visibility: 'visible',
          },
          '& .MuiInputBase': {
            backgroundColor: '#6666',
          },
          '& input': {
            fontWeight: 'bold',
          },
          '& fieldset': {
            borderWidth: 2,
            borderColor: 'black',
          },
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <FilterProvider>
        <Home />
      </FilterProvider>
    </ThemeProvider>
  )
}

export default App
