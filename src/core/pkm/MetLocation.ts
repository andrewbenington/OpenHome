import { MonFormat } from '@openhome-core/pkm/interfaces'
import {
  formatMatchesOrigin,
  Language,
  Lookup,
  OriginGame,
  OriginGames,
  PkmFormat,
} from '@pkm-rs/pkg'

const FARAWAY_PLACE_STRING = 'in a faraway place' // todo: i18n

export function getLocationStringOrOrigin(
  game: OriginGame,
  index: number,
  format: PkmFormat | 'OHPKM',
  language: Language,
  egg = false
) {
  if (game === OriginGame.Go) {
    return 'in Pokémon GO' // todo: i18n
  } else if (format === 'OHPKM' || formatMatchesOrigin(format, game)) {
    return getLocationString(game, index, language, egg)
  } else if (format === 'PB7' && !OriginGames.isLetsGo(game)) {
    return game <= OriginGame.UltraMoon
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : FARAWAY_PLACE_STRING
  } else if (format === 'PK8' && !OriginGames.isSwSh(game)) {
    return game <= OriginGame.LetsGoEevee
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : FARAWAY_PLACE_STRING
  } else if (format === 'PB8' && !OriginGames.isBdsp(game)) {
    if (game === OriginGame.LegendsArceus) {
      return 'in the Sinnoh region of old' // todo: i18n
    }
    return game <= OriginGame.Shield
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : FARAWAY_PLACE_STRING
  } else if (format === 'PA8' && game !== OriginGame.LegendsArceus) {
    if (OriginGames.isBdsp(game)) {
      return 'in the Sinnoh region made new' // todo: i18n
    }
    return game <= OriginGame.ShiningPearl
      ? `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
      : FARAWAY_PLACE_STRING
  }
  return `in the ${OriginGames.gameSettingName(game)} region` // todo: i18n
}

export const getLocationString = (
  game: OriginGame,
  index: number,
  language: Language,
  egg = false
) => {
  if (game <= OriginGame.White && index === 30001) {
    return 'at the Poké Transfer Lab' // todo: i18n
  }

  const location = Lookup.locationName(game, language, index)
  if (!location) return `[LOCATION INDEX ${index}]` // todo: i18n

  if (egg) {
    return `from ${location}`
  } else if (
    (OriginGames.isBdsp(game) || (game >= OriginGame.Sword && index < 30000)) &&
    language === Language.English
  ) {
    // handle english nominatives for relevant locations in all switch games
    // contributions welcome for non-english!
    return location
  } else if (
    (OriginGames.isSwSh(game) || game === OriginGame.LegendsArceus) &&
    language !== Language.English &&
    index < 30000
  ) {
    return location // handle supported non-English nominative locations
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
  return getLocationString(ORIGIN_GAME_BY_FORMAT[format], index, language, egg)
}
