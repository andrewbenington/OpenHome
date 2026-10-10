import { PKM } from '@openhome-core/pkm/PKM'
import * as types from '@openhome-core/util/types'
import { getDisplayID } from '@openhome-core/util/util'
import { MonTag } from '@openhome-ui/util/tags'
import { Ball, Gender, ShinyLeaves } from '@pkm-rs/pkg'
import dayjs from 'dayjs'
import { getBaseEvolution } from './util'

export const SortTypes = [
  'Nickname',
  'Level',
  'Species',
  'Species Family',
  'Gender',
  'Ribbon Count',
  'Met Date',
  'Origin',
  'Shiny Status',
  'Trainer',
  'Poké Ball',
  'Held Item',
  'Is Egg',
  'Shiny Leaves',
  'Display Color',
  'First Tag',
  'Tag Count',
  'Has Notes',
]

export type SortType = (typeof SortTypes)[number]

type PkmSorter = (a: SortablePkmFields, b: SortablePkmFields) => number

type MonTagLike = { label: string; color?: string; icon?: string }

type MonWithManagementData = SortablePkmFields & {
  tags?: MonTagLike[]
  notes?: string
  displayColor?: string
}

function monTags(mon: SortablePkmFields): MonTagLike[] {
  return (mon as MonWithManagementData).tags ?? []
}

function monNotes(mon: SortablePkmFields): string | undefined {
  return (mon as MonWithManagementData).notes
}

function monDisplayColor(mon: SortablePkmFields): string {
  return (mon as MonWithManagementData).displayColor ?? ''
}

function chain(sorters: PkmSorter[]): PkmSorter {
  return (a: SortablePkmFields, b: SortablePkmFields) => {
    for (const sorter of sorters) {
      const diff = sorter(a, b)

      if (diff !== 0) return diff
    }

    return 0
  }
}

function sortByDexNum(a: SortablePkmFields, b: SortablePkmFields) {
  return a.nationalDex - b.nationalDex
}

function sortByFormIndex(a: SortablePkmFields, b: SortablePkmFields) {
  return (a.formIndex ?? 0) - (b.formIndex ?? 0)
}

function sortByBaseEvolution(a: SortablePkmFields, b: SortablePkmFields) {
  const nationalDexA = getBaseEvolution(a.nationalDex, a.formIndex)?.nationalDex ?? 0
  const nationalDexB = getBaseEvolution(b.nationalDex, b.formIndex)?.nationalDex ?? 0
  return nationalDexA - nationalDexB
}

export type PkmWithMetDate = {
  metDate?: types.PKMDate | undefined
}

function sortByMetDate(a: PkmWithMetDate, b: PkmWithMetDate) {
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

function sortByRibbonCount(a: SortablePkmFields, b: SortablePkmFields) {
  const aCount = a.ribbons ? a.ribbons.length : 0
  const bCount = b.ribbons ? b.ribbons.length : 0

  return bCount - aCount
}

function sortByShinyStatus(a: SortablePkmFields, b: SortablePkmFields) {
  return -1 * (Number(a.isShiny()) - Number(b.isShiny()))
}

function sortByTrainerName(a: SortablePkmFields, b: SortablePkmFields) {
  return a.trainerName.localeCompare(b.trainerName)
}

function sortByTrainerId(a: SortablePkmFields, b: SortablePkmFields) {
  return parseInt(getDisplayID(a as PKM)) - parseInt(getDisplayID(b as PKM))
}

function sortBySecretId(a: SortablePkmFields, b: SortablePkmFields) {
  return a.trainerID - b.trainerID
}

function sortByHeldItem(a: SortablePkmFields, b: SortablePkmFields) {
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
): (a: SortablePkmFields, b: SortablePkmFields) => number {
  switch (sortStr) {
    case 'Nickname':
      return (a, b) => a.nickname.localeCompare(b.nickname)
    case 'Level':
      return (a, b) => b.getLevel() - a.getLevel()
    case 'Species':
      return chain([sortByDexNum, sortByFormIndex])
    case 'Species Family':
      return chain([sortByBaseEvolution, sortByDexNum, sortByFormIndex])
    case 'Gender':
      return (a, b) => (a.gender ?? Gender.Genderless) - (b.gender ?? Gender.Genderless)
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
    case 'Is Egg':
      return (a, b) => Number(a.isEgg) - Number(b.isEgg)
    case 'Shiny Leaves':
      return (a, b) =>
        (b.shinyLeaves?.hasCrown() ? 6 : (b.shinyLeaves?.count() ?? 0)) -
        (a.shinyLeaves?.hasCrown() ? 6 : (a.shinyLeaves?.count() ?? 0))
    case 'Held Item':
      return sortByHeldItem
    case 'First Tag':
      return (a, b) => {
        const getFirstTag = (mon: SortablePkmFields) => {
          return monTags(mon)[0]?.label ?? ''
        }
        return getFirstTag(a).localeCompare(getFirstTag(b))
      }
    case 'Tag Count':
      return (a, b) => {
        const getTagCount = (mon: SortablePkmFields) => monTags(mon).length
        return getTagCount(b) - getTagCount(a)
      }
    case 'Has Notes':
      return (a, b) => {
        const hasNotes = (mon: SortablePkmFields) => {
          const notes = monNotes(mon)
          return typeof notes === 'string' && notes.trim().length > 0
        }
        return Number(hasNotes(b)) - Number(hasNotes(a))
      }
    case 'Display Color':
      return (a, b) => monDisplayColor(a).localeCompare(monDisplayColor(b))
    default:
      return () => {
        console.error('unrecognized sort term:', sortStr)
        return 0
      }
  }
}

export function getSortFunctionNullable(
  sortStr: SortType | undefined
): (a: SortablePkmFields | undefined, b: SortablePkmFields | undefined) => number {
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

export interface SortablePkmFields {
  nationalDex: number
  formIndex: number
  nickname: string
  getLevel: () => number
  gender?: Gender
  gameOfOrigin: number
  metDate?: types.PKMDate | undefined
  ribbons?: string[]
  isShiny: () => boolean
  trainerName: string
  trainerID: number
  ball?: number
  heldItemIndex: number
  heldItemName: string
  isEgg?: boolean
  shinyLeaves?: ShinyLeaves
  tags?: MonTag[]
  notes?: string
  displayColor?: string
}
