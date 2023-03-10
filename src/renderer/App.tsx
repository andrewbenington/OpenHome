import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import Home from './Home';

const theme = createTheme({
  components: {
    MuiSelect: {
      styleOverrides: {
        select: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Home />
    </ThemeProvider>
  );
}

export default App;
