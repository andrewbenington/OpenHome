import dayjs from 'dayjs'
import { colosseumOrXD, ColosseumOrXD, GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { PKMInterface } from '../../types/interfaces'
import { getPluginIdentifier, SAVClass } from '../../types/SAVTypes/util'
import { GameLogos, getOriginMark } from '../images/game'
import { getPublicImageURL } from '../images/images'

export type SaveViewMode = 'cards' | 'grid'

export function getMonSaveLogo(mon: PKMInterface, supportedSaves: SAVClass[]) {
  // if (mon.pluginOrigin) {
  //   const pluginIdentifier = supportedSaves.find((s) => getPluginIdentifier(s) === mon.pluginOrigin)
  //   return getPublicImageURL(`logos/${pluginIdentifier}.png`)
  // }
  if (!mon.gameOfOrigin) {
    return getPublicImageURL(getOriginMark('GB'))
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
