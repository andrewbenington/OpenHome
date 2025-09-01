import dayjs from 'dayjs'
import { PKMInterface } from '../interfaces'
import { getBaseMon } from './util'

export const SortTypes = [
  'Nickname',
  'Level',
  'Species',
  'Species Family',
  'Ribbon Count',
  'Met Date',
  'Origin',
]

export type SortType = (typeof SortTypes)[number]

export type PkmSorter = (a: PKMInterface, b: PKMInterface) => number

function chain(sorters: PkmSorter[]): PkmSorter {
  return (a: PKMInterface, b: PKMInterface) => {
    for (const sorter of sorters) {
      const diff = sorter(a, b)

      if (diff !== 0) return diff
    }

    return 0
  }
}

function sortByDexNum(a: PKMInterface, b: PKMInterface) {
  return a.dexNum - b.dexNum
}

function sortByFormeNum(a: PKMInterface, b: PKMInterface) {
  return (a.formeNum ?? 0) - (b.formeNum ?? 0)
}

function sortByBaseMon(a: PKMInterface, b: PKMInterface) {
  return getBaseMon(a.dexNum, a.formeNum).dexNumber - getBaseMon(b.dexNum, b.formeNum).dexNumber
}

export function getSortFunction(
  sortStr: SortType | undefined
): (a: PKMInterface, b: PKMInterface) => number {
  switch (sortStr) {
    case 'Nickname':
      return (a, b) => a.nickname.localeCompare(b.nickname)
    case 'Level':
      return (a, b) => b.getLevel() - a.getLevel()
    case 'Species':
      return chain([sortByDexNum, sortByFormeNum])
    case 'Species Family':
      return chain([sortByBaseMon, sortByDexNum, sortByFormeNum])
    case 'Origin':
      return (a, b) => a.gameOfOrigin - b.gameOfOrigin
    case 'Met Date':
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
    case 'Ribbon Count':
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
