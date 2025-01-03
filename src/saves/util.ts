import dayjs from 'dayjs'
import { colosseumOrXD, ColosseumOrXD, GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { GameLogos, getOriginMark } from '../images/game'
import { getPublicImageURL } from '../images/images'
import { PKMInterface } from '../types/interfaces'
import { Box, SAV } from '../types/SAVTypes/SAV'
import { getPluginIdentifier, SAVClass } from '../types/SAVTypes/util'
import { filterUndefined } from '../util/Sort'

export type SaveViewMode = 'card' | 'grid'

export function getMonSaveLogo(mon: PKMInterface, supportedSaves: SAVClass[]) {
  if (mon.pluginOrigin) {
    const pluginSave = supportedSaves.find((s) => getPluginIdentifier(s) === mon.pluginOrigin)

    return `logos/${getPluginIdentifier(pluginSave)}.png`
  }
  if (!mon.gameOfOrigin) {
    return getOriginMark('GB')
  }
  if (mon.gameOfOrigin === GameOfOrigin.ColosseumXD) {
    switch (colosseumOrXD(mon.dexNum, mon.ribbons?.includes('National Ribbon') || mon.isShadow)) {
      case ColosseumOrXD.Colosseum:
        return GameLogos.Colosseum
      case ColosseumOrXD.XD:
        return GameLogos.XD
      case ColosseumOrXD.NotDeterminable:
        return GameLogos.ColosseumXD
    }
  }
  if (mon.gameOfOrigin === -1) {
    return GameLogos.GB
  }
  return GameLogos[
    GameOfOriginData[mon.gameOfOrigin]?.logo ??
      GameOfOriginData[mon.gameOfOrigin]?.name.replace(' ', '') ??
      ''
  ]
}

export function getSaveLogo(saveType: SAVClass | undefined, origin: GameOfOrigin): string {
  if (saveType?.prototype.getPluginIdentifier.call({})) {
    return getPublicImageURL(`logos/${saveType.prototype.getPluginIdentifier.call({})}.png`)
  }
  if (!origin) {
    return getPublicImageURL(getOriginMark('GB'))
  }
  return GameLogos[
    GameOfOriginData[origin]?.logo ?? GameOfOriginData[origin]?.name.replace(' ', '') ?? ''
  ]
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
  save: SAV,
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
  save: SAV,
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
  save: SAV,
  index?: number,
  callback?: (index?: number) => void
) {
  const boxSize = save.boxColumns * save.boxRows
  const getPrevious = (index: number) => (index === 0 ? boxSize - 1 : index - 1)

  return buildNavigator(getPrevious, save, index, callback)
}
