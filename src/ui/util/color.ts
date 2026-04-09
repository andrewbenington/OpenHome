import { PkmType } from '@pkm-rs/pkg'

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

  return L <= 0.35
}

export const SHADOW_TYPE_COLOR = '#604E82'

export const colorForType = (type: PkmType) => {
  switch (type) {
    case 'Normal':
      return 'rgb(144,153,161)'
    case 'Fire':
      return 'rgb(255, 156, 84)'
    case 'Fighting':
      return 'rgb(206, 64, 105)'
    case 'Water':
      return 'rgb(76, 144, 214)'
    case 'Flying':
      return 'rgb(143, 168, 221)'
    case 'Grass':
      return 'rgb(99, 187, 91)'
    case 'Poison':
      return 'rgb(171, 106, 200)'
    case 'Electric':
      return 'rgb(244, 210, 59)'
    case 'Ground':
      return 'rgb(217, 119, 70)'
    case 'Psychic':
      return 'rgb(249, 113, 119)'
    case 'Rock':
      return 'rgb(199, 183, 139)'
    case 'Ice':
      return 'rgb(116, 206, 192)'
    case 'Bug':
      return 'rgb(144, 193, 44)'
    case 'Dragon':
      return 'rgb(10, 109, 196)'
    case 'Ghost':
      return 'rgb(83, 105, 172)'
    case 'Dark':
      return 'rgb(90, 83, 102)'
    case 'Steel':
      return 'rgb(90, 142, 161)'
    case 'Fairy':
      return 'rgb(236, 143, 230)'
    default:
      return '#555'
  }
}

export const contrastColorForType = (type: PkmType) => {
  switch (type) {
    case 'Electric':
      return 'black'
    default:
      return 'white'
  }
}
