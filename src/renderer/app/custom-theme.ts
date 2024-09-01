import { DefaultPaletteRange, PaletteVariant } from '@mui/joy/styles/types'
import '@mui/material'

declare module '@mui/joy/styles' {
  interface PaletteBackground {
    gradient: string
  }
  interface Palette {
    secondary: DefaultPaletteRange & PaletteVariant
  }
}

declare module '@mui/joy' {
  interface PaperPropsVariantOverrides {
    contained: true
  }
}
