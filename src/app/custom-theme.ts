import { DefaultPaletteRange, PaletteVariant } from '@mui/joy/styles/types'
import '@mui/material'

declare module '@mui/joy/styles' {
  interface PaletteBackground {
    gradient: string
  }

  interface Palette {
    secondary: DefaultPaletteRange & PaletteVariant
  }

  interface ColorPalettePropOverrides {
    // apply to all Joy UI components that support `color` prop
    secondary: true
  }
}

declare module '@mui/joy' {
  interface PaperPropsVariantOverrides {
    contained: true
  }
}
