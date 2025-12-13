import { OriginGames } from '@pkm-rs/pkg'
import dayjs from 'dayjs'
import { HomeData } from 'src/core/SAVTypes/HomeData'
import { Box, SAV } from 'src/core/SAVTypes/SAV'
import { PKMInterface } from 'src/types/interfaces'
import { SaveRef } from 'src/types/types'
import BackendInterface from 'src/ui/backend/backendInterface'
import { CtxMenuElementBuilder, ItemBuilder } from 'src/ui/components/context-menu/types'
import { Option } from '../util/Functional'
import { filterUndefined } from '../util/Sort'

export type SaveViewMode = 'card' | 'grid'

export function logoFromSaveRef(ref: SaveRef): string | undefined {
  return ref.pluginIdentifier
    ? `logos/${ref.pluginIdentifier}.png`
    : ref.game
      ? OriginGames.logoPath(ref.game)
      : undefined
}

export function formatTimeSince(timestamp?: number) {
  if (!timestamp) return ''
  const now = Date.now()
  const seconds = Math.floor((now - timestamp) / 1000)
  let interval = seconds / 31536000

  if (interval > 1) {
    return `${Math.floor(interval)} year${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return `${Math.floor(interval)} month${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 86400
  if (interval > 1) {
    return `${Math.floor(interval)} day${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 3600
  if (interval > 1) {
    return `${Math.floor(interval)} hour${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 60
  if (interval > 1) {
    return `${Math.floor(interval)} minute${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  return `${Math.floor(seconds)} second${Math.floor(seconds) > 1 ? 's' : ''} ago`
}

export function formatTime(timestamp?: number) {
  if (!timestamp) return ''

  const now = dayjs()
  const todayString = now.format('MM/DD/YYYY')
  const yesterdayString = now.add(-1, 'day').format('MM/DD/YYYY')
  const date = dayjs.unix(timestamp / 1000)
  const dateString = date.format('MM/DD/YYYY')

  if (dateString === todayString) {
    return date.format('[Today at] h:mm:ss a')
  } else if (dateString === yesterdayString) {
    return date.format('[Yesterday at] h:mm:ss a')
  } else {
    return date.format('MMM D YYYY [at] h:mm:ss a')
  }
}

export function filterEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 *
 * Iterates through the box, updating the index with 'incrementFunction'. Returns
 * undefined if the first non-empty slot is at 'index', otherwise returns the index of the
 * first non-empty box slot
 */
export function getFollowingMon(
  currentBox: Box<PKMInterface>,
  incrementFunction: (index: number) => number,
  index: number
) {
  let prevIndex = index

  do {
    prevIndex = incrementFunction(prevIndex)
  } while (prevIndex !== index && currentBox.pokemon[prevIndex] === undefined)

  if (prevIndex !== index) {
    return prevIndex
  }
}

export function buildNavigator(
  incrementFunction: (index: number) => number,
  save: SAV | HomeData,
  currentIndex?: number,
  callback?: (index?: number) => void
) {
  if (currentIndex === undefined) return undefined
  const currentBox =
    save.currentPCBox < save.boxes.length ? save.boxes[save.currentPCBox] : undefined

  if (!currentBox || currentBox?.pokemon.filter(filterUndefined).length < 2) {
    return undefined
  }

  return callback
    ? () => callback(getFollowingMon(currentBox, incrementFunction, currentIndex))
    : () => getFollowingMon(currentBox, incrementFunction, currentIndex)
}

/**
 *
 * If there are at least two Pokémon in the save's current box, returns a function
 * that gives the next index of a Pokémon (wrapping end to start if necessary).
 * Otherwise returns undefined
 */
export function buildForwardNavigator(
  save: SAV | HomeData,
  currentIndex?: number,
  callback?: (index?: number) => void
) {
  if (!save || currentIndex === undefined) return undefined
  const currentBox =
    save.currentPCBox < save.boxes.length ? save.boxes[save.currentPCBox] : undefined

  if (!currentBox || currentBox?.pokemon.filter(filterUndefined).length < 2) {
    return undefined
  }

  const boxSize = save.boxColumns * save.boxRows
  const getNext = (index: number) => (index + 1) % boxSize

  return buildNavigator(getNext, save, currentIndex, callback)
}

/**
 *
 * If there are at least two Pokémon in the save's current box, returns a function
 * that gives the previous index of a Pokémon (wrapping start to end if necessary).
 * Otherwise returns undefined
 */
export function buildBackwardNavigator(
  save: SAV | HomeData,
  index?: number,
  callback?: (index?: number) => void
) {
  const boxSize = save.boxColumns * save.boxRows
  const getPrevious = (index: number) => (index === 0 ? boxSize - 1 : index - 1)

  return buildNavigator(getPrevious, save, index, callback)
}

export function buildRecentSaveContextElements(
  save: SaveRef,
  backend: BackendInterface,
  removeRecentSave?: (path: string) => void
): Option<CtxMenuElementBuilder>[] {
  return [
    removeRecentSave
      ? ItemBuilder.fromLabel('Remove Save').withAction(() => removeRecentSave(save.filePath.raw))
      : undefined,
    ItemBuilder.fromLabel(
      `Reveal in ${backend.getPlatform() === 'macos' ? 'Finder' : 'File Explorer'}`
    ).withAction(() => backend.openDirectory(save.filePath.dir)),
  ]
}
