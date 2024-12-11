export const getTypeColor = (type: string) => {
  switch (type) {
    case 'normal':
      return 'rgb(144,153,161)'
    case 'fire':
      return 'rgb(255, 156, 84)'
    case 'fighting':
      return 'rgb(206, 64, 105)'
    case 'water':
      return 'rgb(76, 144, 214)'
    case 'flying':
      return 'rgb(143, 168, 221)'
    case 'grass':
      return 'rgb(99, 187, 91)'
    case 'poison':
      return 'rgb(171, 106, 200)'
    case 'electric':
      return 'rgb(244, 210, 59)'
    case 'ground':
      return 'rgb(217, 119, 70)'
    case 'psychic':
      return 'rgb(249, 113, 119)'
    case 'rock':
      return 'rgb(199, 183, 139)'
    case 'ice':
      return 'rgb(116, 206, 192)'
    case 'bug':
      return 'rgb(144, 193, 44)'
    case 'dragon':
      return 'rgb(10, 109, 196)'
    case 'ghost':
      return 'rgb(83, 105, 172)'
    case 'dark':
      return 'rgb(90, 83, 102)'
    case 'steel':
      return 'rgb(90, 142, 161)'
    case 'fairy':
      return 'rgb(236, 143, 230)'
    case 'shadow':
      return '#604E82'
    default:
      return '#555'
  }
}
