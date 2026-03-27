import { MonFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ConvertStrategies, ConvertStrategy, OriginGame } from '@pkm-rs/pkg'
import { Option } from '../../../../src/core/util/functional'
import {
  NotableLocationKey,
  NotableLocations,
} from '../../../pokemon-resources/src/locations/notable-locations'

export class PkmConverter {
  format: MonFormat
  strategy: ConvertStrategy

  constructor(format: MonFormat, strategy?: ConvertStrategy) {
    this.format = format
    this.strategy = { ...ConvertStrategies.getDefault(), ...strategy }
  }

  nickname(ohpkm: OHPKM): string {
    const speciesName = ohpkm.speciesMetadata?.name
    if (!speciesName || ohpkm.nickname.toUpperCase() !== speciesName.toUpperCase()) {
      return ohpkm.nickname
    }

    const capitalizationSetting = this.strategy['nickname.capitalization']
    if (capitalizationSetting === 'Modern') {
      return speciesName
    } else {
      switch (this.format) {
        case 'PK1':
        case 'PK2':
        case 'PK3':
        case 'COLOPKM':
        case 'XDPKM':
        case 'PK4':
        case 'PK5':
          return speciesName.toUpperCase()
        default:
          return speciesName
      }
    }
  }

  metLocationIndex(ohpkm: OHPKM): number {
    if (!this.strategy['metLocation.useRegion']) return ohpkm.metLocationIndex

    const regionLocationIndex = NotableLocations[this.format]
    if (!regionLocationIndex) return ohpkm.metLocationIndex

    const primary = notableLocationByOriginGame(ohpkm.gameOfOrigin)
    const fallback = notableLocationFallbackByOriginGame(ohpkm.gameOfOrigin)

    if (regionLocationIndex[primary]) {
      return regionLocationIndex[primary]
    } else if (fallback && regionLocationIndex[fallback]) {
      return regionLocationIndex[fallback]
    } else {
      return regionLocationIndex.LinkTrade
    }
  }

  metLocationIndexDpPk4(ohpkm: OHPKM): number {
    if (ohpkm.metLocationIndex) {
      return validDPLocation(ohpkm.metLocationIndex) ? ohpkm.metLocationIndex : DP_FARAWAY_PLACE
    } else {
      return 0
    }
  }

  metLocationIndexPtHGSS(ohpkm: OHPKM): number {
    if (ohpkm.metLocationIndex && validDPLocation(ohpkm.metLocationIndex)) {
      return ohpkm.metLocationIndex
    } else {
      return DP_FARAWAY_PLACE
    }
  }
}
function notableLocationByOriginGame(game: OriginGame): NotableLocationKey {
  switch (game) {
    case OriginGame.Red:
    case OriginGame.BlueGreen:
    case OriginGame.BlueJpn:
    case OriginGame.Yellow:
      return 'KantoVirtualConsole'
    case OriginGame.Gold:
    case OriginGame.Silver:
    case OriginGame.Crystal:
      return 'JohtoVirtualConsole'
    case OriginGame.Ruby:
    case OriginGame.Sapphire:
    case OriginGame.Emerald:
      return 'HoennRse'
    case OriginGame.HeartGold:
    case OriginGame.SoulSilver:
      return 'JohtoHgSs'
    case OriginGame.FireRed:
    case OriginGame.LeafGreen:
      return 'KantoFrLg'
    case OriginGame.Diamond:
    case OriginGame.Pearl:
    case OriginGame.Platinum:
      return 'SinnohDPPt'
    case OriginGame.Black:
    case OriginGame.White:
    case OriginGame.Black2:
    case OriginGame.White2:
      return 'Unova'
    case OriginGame.X:
    case OriginGame.Y:
      return 'Kalos'
    case OriginGame.OmegaRuby:
    case OriginGame.AlphaSapphire:
      return 'HoennORAS'
    case OriginGame.Sun:
    case OriginGame.Moon:
    case OriginGame.UltraSun:
    case OriginGame.UltraMoon:
      return 'Alola'
    case OriginGame.Go:
      return 'PokemonGo'
    case OriginGame.LetsGoPikachu:
    case OriginGame.LetsGoEevee:
      return 'KantoLetsGo'
    case OriginGame.Home:
      return 'PokemonHome'
    case OriginGame.Sword:
    case OriginGame.Shield:
      return 'Galar'
    case OriginGame.LegendsArceus:
      return 'Hisui'
    case OriginGame.BrilliantDiamond:
    case OriginGame.ShiningPearl:
      return 'SinnohBDSP'
    case OriginGame.Scarlet:
    case OriginGame.Violet:
      return 'Paldea'
    case OriginGame.LegendsZa:
      return 'Lumiose'
    default:
      return 'LinkTrade'
  }
}

function notableLocationFallbackByOriginGame(game: OriginGame): Option<NotableLocationKey> {
  switch (game) {
    case OriginGame.Red:
    case OriginGame.BlueGreen:
    case OriginGame.BlueJpn:
    case OriginGame.Yellow:
      return 'KantoFrLg'
    case OriginGame.Gold:
    case OriginGame.Silver:
    case OriginGame.Crystal:
      return 'JohtoHgSs'
    case OriginGame.OmegaRuby:
    case OriginGame.AlphaSapphire:
      return 'HoennRse'
    case OriginGame.LetsGoPikachu:
    case OriginGame.LetsGoEevee:
      return 'KantoFrLg'
    case OriginGame.LegendsArceus:
    case OriginGame.BrilliantDiamond:
    case OriginGame.ShiningPearl:
      return 'SinnohDPPt'
    case OriginGame.LegendsZa:
      return 'Kalos'
  }
}

const DP_FARAWAY_PLACE = 0xbba

function validDPLocation(index: number): boolean {
  return index >= 0x0070 && index < 2000
}
