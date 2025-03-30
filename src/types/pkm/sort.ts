import dayjs from 'dayjs'
import { PKMInterface } from '../interfaces'

export type SortType = 'nickname' | 'level' | 'species' | 'origin' | 'met_date' | 'ribbons' | ''
export const SortTypes: SortType[] = [
  '',
  'nickname',
  'level',
  'species',
  'ribbons',
  'met_date',
  'origin',
]

export function getSortFunction(
  sortStr: SortType | undefined
): (a: PKMInterface, b: PKMInterface) => number {
  switch (sortStr?.toLowerCase()) {
    case 'nickname':
      return (a, b) => a.nickname.localeCompare(b.nickname)
    case 'level':
      return (a, b) => b.getLevel() - a.getLevel()
    case 'species':
      return (a, b) => a.dexNum - b.dexNum
    case 'origin':
      return (a, b) => a.gameOfOrigin - b.gameOfOrigin
    case 'met_date':
      return (a, b) => {
        const aDate =
          'metDate' in a && a.metDate
            ? dayjs(new Date(a.metDate.year, a.metDate.month, a.metDate.day)).unix()
            : 0
        const bDate =
          'metDate' in b && b.metDate
            ? dayjs(new Date(b.metDate.year, b.metDate.month, b.metDate.day)).unix()
            : 0

        return bDate - aDate
      }
    case 'ribbons':
      return (a, b) => {
        const aCount = a.ribbons ? a.ribbons.length : 0
        const bCount = b.ribbons ? b.ribbons.length : 0

        return bCount - aCount
      }
    default:
      return () => {
        console.error('unrecognized sort term:', sortStr)
        return 0
      }
  }
}

export function getSortFunctionNullable(
  sortStr: SortType | undefined
): (a: PKMInterface | undefined, b: PKMInterface | undefined) => number {
  const sortFunction = getSortFunction(sortStr)

  return (a, b) => {
    if (!a && !b) {
      return 0
    }
    if (!a) return 1
    if (!b) return -1
    return sortFunction(a, b)
  }
}
