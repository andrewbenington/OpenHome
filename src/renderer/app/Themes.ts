import { Components, Theme } from '@mui/joy'
import { ColorSystemOptions, CssVarsThemeOptions } from '@mui/joy/styles/extendTheme'

// const teal = '#53B4A5'
const lightTeal = '#7DCEAB'
const red = '#BC4749'
const red2 = '#e45454'
// const green = '#84DD63'
// const yellow = '#FFC31F'
const tealGradient = 'linear-gradient(355deg, rgba(83,180,165,1) 0%, rgba(125,206,171,1) 85%)'
const darkTealGradient = 'linear-gradient(310deg, rgba(54,69,78,1) 0%, rgba(1,83,84,1) 85%)'
// const oldBackground = '#A9CEF4'

export const components: Components<Theme> = {
  JoyChip: {
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
  JoyCard: {
    styleOverrides: {
      root: {
        padding: 8,
        borderRadius: 5,
      },
    },
  },
  JoyStack: {
    defaultProps: {
      spacing: 1,
    },
  },
  JoyButton: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        ':hover': {
          boxShadow: 'none',
        },
        padding: 0,
      },
    },
    // variants: [
    //   {
    //     props: { variant: 'contained' },
    //     style: {
    //       border: '1px solid transparent',
    //       boxShadow: 'none',
    //     },
    //   },
    // ],
  },
  JoyTab: {
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
  JoyModal: {
    styleOverrides: {
      root: {
        display: 'grid',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  },
  JoyModalDialog: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  JoyTypography: {
    styleOverrides: {
      root: {
        color: 'inherit',
      },
    },
  },
  JoyAccordionSummary: {
    defaultProps: {
      style: {
        // marginBottom: 0,
        marginInline: 0,
      },
    },
  },
  JoyAccordionDetails: {
    defaultProps: {
      style: {
        padding: 0,
        margin: 0,
      },
      sx: {
        '& .MuiAccordionDetails-content': {
          padding: 0,
          // paddingBlock: 0,
        },
      },
    },
  },
  JoyAccordion: {
    defaultProps: {
      sx: {
        padding: 0,
      },
    },
  },
  JoyAccordionGroup: {
    defaultProps: {
      style: {
        flex: 0,
      },
      transition: '0.2s ease',
    },
  },
}

export const darkTheme: ColorSystemOptions = {
  palette: {
    mode: 'dark',
    secondary: {
      mainChannel: red,
    },
    primary: {
      mainChannel: '#780600',
    },
    background: {
      body: '#2c313a',
      gradient: darkTealGradient,
      surface: '#081721',
    },
    text: {
      primary: '#fff',
      icon: '#fff',
      secondary: '#ccc',
    },
    neutral: {
      outlinedColor: '#fff',
      plainHoverBg: '#fff3',
      outlinedBg: '#081721',
      plainColor: '#fff',
      outlinedHoverBg: '#fff3',
      plainHoverColor: '#fff',
      plainActiveBg: '#0000',
    },
  },
}

export const lightTheme: ColorSystemOptions = {
  palette: {
    secondary: {
      mainChannel: red,
    },
    primary: {
      mainChannel: red2,
    },
    background: {
      body: lightTeal,
      gradient: tealGradient,
      surface: '#dfd',
    },
    text: {
      primary: '#333',
      secondary: '#000',
    },
  },
}

export const defaultTheme: CssVarsThemeOptions = {
  colorSchemes: {
    dark: darkTheme,
    light: lightTheme,
  },
  components,
}
