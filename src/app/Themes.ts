import { Components, Theme } from '@mui/joy'
import { ColorSystemOptions, CssVarsThemeOptions } from '@mui/joy/styles/extendTheme'

// const teal = '#53B4A5'
export const lightTeal = '#7DCEAB'
export const lightTealSelected = '#aedac3'
export const red = '#BC4749'
export const red2 = '#e45454'
// const green = '#84DD63'
// const yellow = '#FFC31F'
export const tealGradient =
  'linear-gradient(355deg, rgba(83,180,165,1) 0%, rgba(125,206,171,1) 85%)'
export const darkTealGradient = 'linear-gradient(310deg, rgba(54,69,78,1) 0%, rgba(1,83,84,1) 85%)'
// const oldBackground = '#A9CEF4'

export const components: Components<Theme> = {
  JoyChip: {
    styleOverrides: {
      root: {
        transition: 'border 0.25s',
      },
    },
  },
  JoyCard: {
    styleOverrides: {
      root: {
        padding: 8,
        borderRadius: 5,
      },
    },
    defaultProps: {
      variant: 'plain',
    },
  },
  JoyStack: {
    defaultProps: {
      spacing: 1,
    },
  },
  JoyButton: {
    styleOverrides: {
      root: ({ ownerState }) => ({
        boxShadow: 'none',
        ':hover': {
          boxShadow: 'none',
        },
        padding: 0,
        minHeight: ownerState.size === 'sm' ? 0 : undefined,
        height: 'fit-content',
        '--Button-radius': '3px',
      }),
    },
  },
  JoyTab: {
    styleOverrides: {
      root: {
        fontWeight: 'bold',
      },
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  JoyTabPanel: {
    styleOverrides: {
      root: ({ theme }) => ({
        background: theme.palette.background.gradient,
        padding: 0,
        height: '100%',
      }),
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
  JoyTabs: {
    styleOverrides: {
      root: {
        '& .MuiTabPanel-root': {
          overflowY: 'auto',
        },
      },
    },
  },
  JoyTabList: {
    styleOverrides: {
      root: {
        paddingBottom: 0,
      },
    },
  },
  JoyModalOverflow: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  JoyMenu: {
    styleOverrides: {
      root: {
        paddingBlock: 0,
      },
    },
  },
  JoyMenuItem: {
    styleOverrides: {
      root: {
        minBlockSize: 0,
        paddingBlock: 2,
        paddingInline: 4,
      },
    },
  },
  JoyMenuButton: {
    styleOverrides: {
      root: {
        padding: 0,
        paddingBlock: 0,
      },
    },
  },
}

export const darkTheme: ColorSystemOptions = {
  palette: {
    mode: 'dark',
    secondary: {
      mainChannel: red,
      solidBg: red,
      solidColor: '#fff',
      softBorder: '#999',
      softActiveBg: red,
      plainColor: '#fff',
    },
    primary: {
      mainChannel: '#780600',
      plainColor: 'white',
      plainHoverBg: 'none',
      plainActiveBg: '#9993',
      plainHoverColor: red2,
      plainActiveColor: red2,
      solidBg: '#466',
      solidHoverBg: '#688',
      solidActiveBg: '#8EAEB0',
    },
    background: {
      body: '#2c313a',
      gradient: darkTealGradient,
      surface: '#081721',
      popup: '#081721',
    },
    text: {
      primary: '#fff',
      icon: '#fff',
      secondary: '#ccc',
    },
    neutral: {
      outlinedColor: '#fff',
      plainColor: '#fff',
      outlinedHoverBg: '#fff3',
      outlinedActiveBg: '#fff6',
      plainActiveBg: '#fff6',
      plainHoverBg: '#333438',
      plainHoverColor: '#fff',
      solidBg: '#505555',
    },
  },
}

export const lightTheme: ColorSystemOptions = {
  palette: {
    secondary: {
      mainChannel: red,
      solidBg: red,
      solidColor: '#fff',
      plainColor: '#333',
      plainHoverBg: red2,
      plainHoverColor: '#fff',
      plainActiveBg: '#9993',
      softBorder: '#999',
      softActiveBg: red,
    },
    primary: {
      mainChannel: red2,
      plainColor: '#000',
      plainActiveColor: red2,
      plainHoverColor: red2,
      plainHoverBg: 'transparent',
      plainActiveBg: '#bee7d5',
      solidBg: '#466',
      solidColor: '#fff',
      solidHoverBg: '#799',
      solidActiveBg: '#688',
    },
    neutral: {
      softBg: '#888',
      softColor: '#fff',
      solidColor: '#fff',
      outlinedHoverBg: '#ccc',
      outlinedColor: '#000',
    },
    background: {
      body: lightTeal,
      gradient: tealGradient,
      surface: '#dfd',
      level2: lightTealSelected,
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
