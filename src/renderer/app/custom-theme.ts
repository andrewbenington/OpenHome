import '@mui/material'

declare module '@mui/material' {
  interface TypeBackground {
    gradient: string
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    contained: true
  }
}
