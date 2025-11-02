export function colorIsDark(bgColor?: string) {
  if (!bgColor) return false
  const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor

  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)

  const uicolors = [r / 255, g / 255, b / 255]
  const c = uicolors.map((color) => {
    if (color <= 0.03928) {
      return color / 12.92
    }
    return Math.pow((color + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

  return L <= 0.179
}

export function contrastingBgColor(color?: string) {
  if (!color) return '#ffffff20'
  return colorIsDark(color) ? '#ffffff19' : '#00000019'
}

export function contrastingTextColor(color?: string) {
  if (!color) return undefined
  return colorIsDark(color) ? '#fff' : '#000'
}

export function contrastingBoxShadow(color?: string) {
  const textColor = contrastingTextColor(color)

  return textColor?.length === 4
    ? `inset 0 0 0 1px ${textColor}6`
    : textColor?.length === 7
      ? `inset 0 0 0 1px ${textColor}60`
      : undefined
}
