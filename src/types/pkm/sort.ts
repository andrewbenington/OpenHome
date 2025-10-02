import { PKM } from '@pokemon-files/pkm'
import { getDisplayID } from '@pokemon-files/util/util'
import dayjs from 'dayjs'
import { Ball } from 'pokemon-resources'
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
  'Shiny Status',
  'Trainer',
  'Poké Ball',
  'Held Item',
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
  const nationalDexA = getBaseMon(a.dexNum, a.formeNum)?.nationalDex ?? 0
  const nationalDexB = getBaseMon(b.dexNum, b.formeNum)?.nationalDex ?? 0
  return nationalDexA - nationalDexB
}

function sortByMetDate(a: PKMInterface, b: PKMInterface) {
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

function sortByRibbonCount(a: PKMInterface, b: PKMInterface) {
  const aCount = a.ribbons ? a.ribbons.length : 0
  const bCount = b.ribbons ? b.ribbons.length : 0

  return bCount - aCount
}

function sortByShinyStatus(a: PKMInterface, b: PKMInterface) {
  return -1 * (Number(a.isShiny()) - Number(b.isShiny()))
}

function sortByTrainerName(a: PKMInterface, b: PKMInterface) {
  return a.trainerName.localeCompare(b.trainerName)
}

function sortByTrainerId(a: PKMInterface, b: PKMInterface) {
  return parseInt(getDisplayID(a as PKM)) - parseInt(getDisplayID(b as PKM))
}

function sortBySecretId(a: PKMInterface, b: PKMInterface) {
  return a.trainerID - b.trainerID
}

function sortByHeldItem(a: PKMInterface, b: PKMInterface) {
  if (a.heldItemIndex === b.heldItemIndex) return 0
  if (a.heldItemIndex === 0 && b.heldItemIndex !== 0) {
    return Number.POSITIVE_INFINITY
  } else if (b.heldItemIndex === 0) {
    return Number.NEGATIVE_INFINITY
  }

  return a.heldItemName.localeCompare(b.heldItemName)
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
      return sortByMetDate
    case 'Ribbon Count':
      return sortByRibbonCount
    case 'Shiny Status':
      return sortByShinyStatus
    case 'Trainer':
      return chain([sortByTrainerName, sortByTrainerId, sortBySecretId])
    case 'Poké Ball':
      return (a, b) => (a.ball ?? Ball.Poke) - (b.ball ?? Ball.Poke)
    case 'Held Item':
      return sortByHeldItem
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
