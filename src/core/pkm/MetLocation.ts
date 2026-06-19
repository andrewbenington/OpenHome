import { MonFormat } from '@openhome-core/pkm/interfaces'
import {
  formatMatchesOrigin,
  Language,
  Lookup,
  OriginGame,
  OriginGames,
  PkmFormat,
} from '@pkm-rs/pkg'

export function getLocationStringOrOrigin(
  game: OriginGame,
  index: number,
  format: PkmFormat | 'OHPKM',
  language: Language,
  egg = false
) {
  if (format === 'OHPKM' || formatMatchesOrigin(format, game)) {
    return getLocationString(game, index, format, language, egg)
  }
  return `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
}

export const getLocationString = (
  game: OriginGame,
  index: number,
  format: string,
  language: Language,
  egg = false
) => {
  if (game <= OriginGame.White && index === 30001) {
    return 'at the Poké Transfer Lab' // todo: i18n
  }

  if (game === OriginGame.Go) {
    return 'in Pokémon GO' // todo: i18n
  }

  if (format === 'PB7' && !OriginGames.isLetsGo(game)) {
    return game <= OriginGame.UltraMoon
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : 'in a faraway place' // todo: i18n
  } else if (format === 'PK8' && !OriginGames.isSwSh(game)) {
    return game <= OriginGame.LetsGoEevee
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : 'in the Faraway place' // todo: i18n
  } else if (format === 'PB8' && !OriginGames.isBdsp(game)) {
    return game <= OriginGame.Shield
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : 'in a faraway place' // todo: i18n
  }

  const location = Lookup.locationName(game, language, index)
  if (!location) return `[LOCATION INDEX ${index}]` // todo: i18n

  if (game === OriginGame.LegendsArceus) {
    return location
  } else if (egg) {
    return `from ${location}`
  } else if (location?.startsWith('Route')) {
    return `on ${location}`
  } else return `in ${location}`
}

const ORIGIN_GAME_BY_FORMAT: { [key: string]: OriginGame } = {
  PK1: OriginGame.Red,
  PK2: OriginGame.Crystal,
  PK3: OriginGame.Emerald,
  PK4: OriginGame.HeartGold,
  PK5: OriginGame.Black2,
  PK6: OriginGame.OmegaRuby,
  PK7: OriginGame.UltraMoon,
  PB7: OriginGame.LetsGoPikachu,
  PK8: OriginGame.Sword,
  PB8: OriginGame.BrilliantDiamond,
  PA8: OriginGame.LegendsArceus,
  PK9: OriginGame.Violet,
  PA9: OriginGame.LegendsZa,
}

export const getFormatLocationString = (
  index: number,
  format: MonFormat,
  language: Language,
  egg = false
) => {
  return getLocationString(ORIGIN_GAME_BY_FORMAT[format], index, format, language, egg)
}
