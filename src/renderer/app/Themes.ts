import { Components, Theme, ThemeOptions } from '@mui/material'

// const teal = '#53B4A5'
const lightTeal = '#7DCEAB'
const red = '#BC4749'
const red2 = '#e45454'
// const green = '#84DD63'
// const yellow = '#FFC31F'
const tealGradient = 'linear-gradient(355deg, rgba(83,180,165,1) 0%, rgba(125,206,171,1) 85%)'
// const oldBackground = '#A9CEF4'

const components: Components<Omit<Theme, 'components'>> = {
  MuiButtonBase: {
    defaultProps: {
      disableRipple: true,
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        transition: 'border 0.25s',
      },
    },
  },
  // MuiTypography: {
  //   defaultProps: {
  //     variant: 'h5',
  //   },
  // },
  MuiTextField: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiCard: {
    defaultProps: {
      sx: {
        padding: 1,
      },
    },
  },
  MuiStack: {
    defaultProps: {
      spacing: 1,
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        ':hover': {
          boxShadow: 'none',
        },
      },
    },
    variants: [
      {
        props: { variant: 'contained' },
        style: {
          border: '1px solid transparent',
          boxShadow: 'none',
        },
      },
    ],
  },
  MuiTab: {
    styleOverrides: {
      root: {
        border: 'none',
        textTransform: 'none',
        fontSize: 14,
        ':hover': {
          border: 'none',
        },
        ':focus': {
          border: 'none',
        },
        fontWeight: 'bold',
      },
    },
  },
  MuiListItemIcon: {
    defaultProps: {
      style: {
        minWidth: 'fit-content',
        maxWidth: 'fit-content',
      },
    },
  },
  MuiListSubheader: {
    defaultProps: {
      sx: {
        backgroundColor: 'transparent',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        overflowY: 'hidden',
      },
      paper: {
        background: tealGradient,
      },
    },
  },
  // MuiDivider: {
  //   styleOverrides: {
  //     root: {
  //       height: 16,
  //       marginBottom: 16,
  //       paddingBottom: 16,
  //     },
  //   },
  // },
}

export const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
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
  components,
}

export const lightTheme: ThemeOptions = {
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
  components,
}
