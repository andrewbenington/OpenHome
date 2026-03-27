import { MonFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import {
  ConvertStrategies,
  ConvertStrategy,
  GameSetting,
  Generation,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'
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
    if (originMatchesFormat(ohpkm.gameOfOrigin, this.format)) return ohpkm.metLocationIndex

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

function originMatchesFormat(game: OriginGame, format: MonFormat): boolean {
  switch (format) {
    case 'PK1':
      return OriginGames.generation(game) === Generation.G1
    case 'PK2':
      return OriginGames.generation(game) === Generation.G2
    case 'PK3':
      return OriginGames.isGba(game)
    case 'COLOPKM':
      return game === OriginGame.ColosseumXd
    case 'XDPKM':
      return game === OriginGame.ColosseumXd
    case 'PK4':
      return OriginGames.generation(game) === Generation.G4
    case 'PK5':
      return OriginGames.generation(game) === Generation.G5
    case 'PK6':
      return OriginGames.generation(game) === Generation.G6
    case 'PK7':
      return (
        OriginGames.generation(game) === Generation.G7 &&
        OriginGames.gameSetting(game) === GameSetting.Alola
      )
    case 'PB7':
      return OriginGames.isLetsGo(game)
    case 'PK8':
      return (
        OriginGames.generation(game) === Generation.G8 &&
        OriginGames.gameSetting(game) === GameSetting.Galar
      )
    case 'PB8':
      return OriginGames.isBdsp(game)
    case 'PA8':
      return game === OriginGame.LegendsArceus
    case 'PK9':
      return OriginGames.isScarletViolet(game)
    case 'PA9':
      return game === OriginGame.LegendsZa
    default:
      return false
  }
}

type OriginAndLocation = {
  origin: OriginGame
  location: number
}

const KANTO_VIRTUAL_CONSOLE_LOCATION = NotableLocations.PK7.KantoVirtualConsole
const JOHTO_VIRTUAL_CONSOLE_LOCATION = NotableLocations.PK7.JohtoVirtualConsole

function convertLocationIndexMostLegitimate(format: MonFormat, ohpkm: OHPKM): OriginAndLocation {
  if (originMatchesFormat(ohpkm.gameOfOrigin, format)) {
    return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
  }
  // The generation's most legitimate way to obtain a Pokémon from the given origin. If none exists, it is treated like an origin that can be legitimately obtained. The origin should be set this way too, i.e. an ORAS mon transerred to Diamond will get an RSE origin and a met location of Pal Park
  switch (format) {
    case 'PK4':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.FireRed:
        case OriginGame.LetsGoPikachu:
          return { origin: OriginGame.FireRed, location: NotableLocations.PK4.PalPark }
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
        case OriginGame.LeafGreen:
        case OriginGame.LetsGoEevee:
          return { origin: OriginGame.LeafGreen, location: NotableLocations.PK4.PalPark }
        case OriginGame.Gold:
          return { origin: OriginGame.HeartGold, location: NotableLocations.PK4.JohtoHgSs } // TODO: match the PK2 origin with a HGSS one.
        case OriginGame.Silver:
        case OriginGame.Crystal:
          return { origin: OriginGame.SoulSilver, location: NotableLocations.PK4.JohtoHgSs } // TODO: match the PK2 origin with a HGSS one.
        case OriginGame.SoulSilver:
          return { origin: OriginGame.SoulSilver, location: ohpkm.metLocationIndex }
        case OriginGame.Ruby:
        case OriginGame.OmegaRuby:
          return { origin: OriginGame.Ruby, location: NotableLocations.PK4.PalPark }
        case OriginGame.Sapphire:
        case OriginGame.AlphaSapphire:
          return { origin: OriginGame.Sapphire, location: NotableLocations.PK4.PalPark }
        case OriginGame.Emerald:
          return { origin: OriginGame.Emerald, location: NotableLocations.PK4.PalPark }
        case OriginGame.ColosseumXd:
          return { origin: OriginGame.ColosseumXd, location: NotableLocations.PK4.PalPark }
        case OriginGame.Diamond:
        case OriginGame.Pearl:
        case OriginGame.Platinum:
        case OriginGame.HeartGold:
        case OriginGame.SoulSilver:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.X:
        case OriginGame.Sun:
        case OriginGame.UltraSun:
        case OriginGame.Sword:
        case OriginGame.Scarlet:
        case OriginGame.Go:
        case OriginGame.Home:
          return { origin: OriginGame.HeartGold, location: NotableLocations.PK4.DistantLand }
        case OriginGame.White:
        case OriginGame.White2:
        case OriginGame.Y:
        case OriginGame.Moon:
        case OriginGame.UltraMoon:
        case OriginGame.Shield:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: OriginGame.SoulSilver, location: NotableLocations.PK4.DistantLand }
        case OriginGame.BrilliantDiamond:
          return { origin: OriginGame.Diamond, location: NotableLocations.PK4.DistantLand }
        case OriginGame.ShiningPearl:
          return { origin: OriginGame.Pearl, location: NotableLocations.PK4.DistantLand }
        case OriginGame.LegendsArceus:
          return { origin: OriginGame.Platinum, location: NotableLocations.PK4.DistantLand } // TODO: match the PLA origin with a PK4 one.
        default:
          return { origin: OriginGame.SoulSilver, location: NotableLocations.PK4.DistantLand }
      }
    case 'PK5':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.FireRed:
        case OriginGame.LetsGoPikachu:
          return { origin: OriginGame.FireRed, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
        case OriginGame.LeafGreen:
        case OriginGame.LetsGoEevee:
          return { origin: OriginGame.LeafGreen, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Gold:
        case OriginGame.HeartGold:
          return { origin: OriginGame.HeartGold, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Silver:
        case OriginGame.Crystal:
        case OriginGame.SoulSilver:
          return { origin: OriginGame.SoulSilver, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Ruby:
        case OriginGame.OmegaRuby:
          return { origin: OriginGame.Ruby, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Sapphire:
        case OriginGame.AlphaSapphire:
          return { origin: OriginGame.Sapphire, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Emerald:
          return { origin: OriginGame.Emerald, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.ColosseumXd:
          return { origin: OriginGame.ColosseumXd, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Diamond:
        case OriginGame.BrilliantDiamond:
          return { origin: OriginGame.Diamond, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Pearl:
        case OriginGame.ShiningPearl:
          return { origin: OriginGame.Pearl, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Platinum:
        case OriginGame.LegendsArceus:
          return { origin: OriginGame.Platinum, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.White:
        case OriginGame.White2:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
        case OriginGame.X:
        case OriginGame.Sun:
        case OriginGame.UltraSun:
        case OriginGame.Sword:
        case OriginGame.Scarlet:
        case OriginGame.Go:
        case OriginGame.Home:
          return { origin: OriginGame.Black2, location: NotableLocations.PK5.DistantLand }
        case OriginGame.Y:
        case OriginGame.Moon:
        case OriginGame.UltraMoon:
        case OriginGame.Shield:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: OriginGame.White2, location: NotableLocations.PK5.DistantLand }
        default:
          return { origin: OriginGame.White2, location: NotableLocations.PK5.DistantLand }
      }
    case 'PK6':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.FireRed:
        case OriginGame.LetsGoPikachu:
          return { origin: OriginGame.FireRed, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
        case OriginGame.LeafGreen:
        case OriginGame.LetsGoEevee:
          return { origin: OriginGame.LeafGreen, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Gold:
        case OriginGame.HeartGold:
          return { origin: OriginGame.HeartGold, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Silver:
        case OriginGame.Crystal:
        case OriginGame.SoulSilver:
          return { origin: OriginGame.SoulSilver, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Ruby:
        case OriginGame.Sapphire:
        case OriginGame.Emerald:
        case OriginGame.ColosseumXd:
          return { origin: ohpkm.gameOfOrigin, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Diamond:
        case OriginGame.BrilliantDiamond:
          return { origin: OriginGame.Diamond, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Pearl:
        case OriginGame.ShiningPearl:
          return { origin: OriginGame.Pearl, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Platinum:
        case OriginGame.LegendsArceus:
          return { origin: OriginGame.Platinum, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.White:
        case OriginGame.White2:
        case OriginGame.X:
        case OriginGame.Y:
        case OriginGame.OmegaRuby:
        case OriginGame.AlphaSapphire:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
        case OriginGame.Sun:
        case OriginGame.UltraSun:
        case OriginGame.Sword:
        case OriginGame.Scarlet:
        case OriginGame.Go:
        case OriginGame.Home:
          return { origin: OriginGame.OmegaRuby, location: NotableLocations.PK6.DistantLand }
        case OriginGame.Moon:
        case OriginGame.UltraMoon:
        case OriginGame.Shield:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: OriginGame.AlphaSapphire, location: NotableLocations.PK6.DistantLand }
        default:
          return { origin: OriginGame.AlphaSapphire, location: NotableLocations.PK6.DistantLand }
      }
    case 'PK7':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
          return { origin: ohpkm.gameOfOrigin, location: KANTO_VIRTUAL_CONSOLE_LOCATION }
        case OriginGame.FireRed:
        case OriginGame.LetsGoPikachu:
          return { origin: OriginGame.FireRed, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.LeafGreen:
        case OriginGame.LetsGoEevee:
          return { origin: OriginGame.LeafGreen, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Gold:
        case OriginGame.Silver:
        case OriginGame.Crystal:
          return { origin: ohpkm.gameOfOrigin, location: JOHTO_VIRTUAL_CONSOLE_LOCATION }
        case OriginGame.Ruby:
        case OriginGame.Sapphire:
        case OriginGame.Emerald:
        case OriginGame.ColosseumXd:
        case OriginGame.HeartGold:
        case OriginGame.SoulSilver:
          return { origin: ohpkm.gameOfOrigin, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Diamond:
        case OriginGame.BrilliantDiamond:
          return { origin: OriginGame.Diamond, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Pearl:
        case OriginGame.ShiningPearl:
          return { origin: OriginGame.Pearl, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Platinum:
        case OriginGame.LegendsArceus:
          return { origin: OriginGame.Platinum, location: NotableLocations.PK5.PokeTransferLab }
        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.White:
        case OriginGame.White2:
        case OriginGame.X:
        case OriginGame.Y:
        case OriginGame.OmegaRuby:
        case OriginGame.AlphaSapphire:
        case OriginGame.Sun:
        case OriginGame.Moon:
        case OriginGame.UltraSun:
        case OriginGame.UltraMoon:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
        case OriginGame.Go:
          return { origin: OriginGame.Go, location: NotableLocations.PK7.PokemonGo }
        case OriginGame.Sword:
        case OriginGame.Scarlet:
        case OriginGame.Home:
          return { origin: OriginGame.UltraSun, location: NotableLocations.PK7.DistantLand }
        case OriginGame.Shield:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: OriginGame.UltraMoon, location: NotableLocations.PK7.DistantLand }
        default:
          return { origin: OriginGame.UltraMoon, location: NotableLocations.PK7.DistantLand }
      }
    case 'PK8':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
          return { origin: ohpkm.gameOfOrigin, location: KANTO_VIRTUAL_CONSOLE_LOCATION }

        case OriginGame.Gold:
        case OriginGame.Silver:
        case OriginGame.Crystal:
          return { origin: ohpkm.gameOfOrigin, location: JOHTO_VIRTUAL_CONSOLE_LOCATION }

        case OriginGame.Ruby:
        case OriginGame.Sapphire:
        case OriginGame.Emerald:
        case OriginGame.FireRed:
        case OriginGame.LeafGreen:
        case OriginGame.ColosseumXd:
        case OriginGame.Diamond:
        case OriginGame.Pearl:
        case OriginGame.Platinum:
        case OriginGame.HeartGold:
        case OriginGame.SoulSilver:
          return { origin: ohpkm.gameOfOrigin, location: NotableLocations.PK5.PokeTransferLab }

        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.White:
        case OriginGame.White2:
        case OriginGame.X:
        case OriginGame.Y:
        case OriginGame.OmegaRuby:
        case OriginGame.AlphaSapphire:
        case OriginGame.Sun:
        case OriginGame.Moon:
        case OriginGame.UltraSun:
        case OriginGame.UltraMoon:
        case OriginGame.LetsGoPikachu:
        case OriginGame.LetsGoEevee:
        case OriginGame.Sword:
        case OriginGame.Shield:
        case OriginGame.Home:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
        case OriginGame.Go:
          return { origin: OriginGame.Go, location: NotableLocations.PB7.GoPark }
        case OriginGame.BrilliantDiamond:
        case OriginGame.ShiningPearl:
        case OriginGame.LegendsArceus:
        case OriginGame.Scarlet:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: OriginGame.Sword, location: NotableLocations.PK8.FarawayPlace }
        default:
          return { origin: OriginGame.Sword, location: NotableLocations.PK8.FarawayPlace }
      }
    case 'PB8':
    case 'PA8':
    case 'PK9':
    case 'PA9':
      switch (ohpkm.gameOfOrigin) {
        case OriginGame.Red:
        case OriginGame.Yellow:
        case OriginGame.BlueGreen:
        case OriginGame.BlueJpn:
          return { origin: ohpkm.gameOfOrigin, location: KANTO_VIRTUAL_CONSOLE_LOCATION }

        case OriginGame.Gold:
        case OriginGame.Silver:
        case OriginGame.Crystal:
          return { origin: ohpkm.gameOfOrigin, location: JOHTO_VIRTUAL_CONSOLE_LOCATION }

        case OriginGame.Ruby:
        case OriginGame.Sapphire:
        case OriginGame.Emerald:
        case OriginGame.FireRed:
        case OriginGame.LeafGreen:
        case OriginGame.ColosseumXd:
        case OriginGame.Diamond:
        case OriginGame.Pearl:
        case OriginGame.Platinum:
        case OriginGame.HeartGold:
        case OriginGame.SoulSilver:
          return { origin: ohpkm.gameOfOrigin, location: NotableLocations.PK5.PokeTransferLab }

        case OriginGame.Black:
        case OriginGame.Black2:
        case OriginGame.White:
        case OriginGame.White2:
        case OriginGame.X:
        case OriginGame.Y:
        case OriginGame.OmegaRuby:
        case OriginGame.AlphaSapphire:
        case OriginGame.Sun:
        case OriginGame.Moon:
        case OriginGame.UltraSun:
        case OriginGame.UltraMoon:
        case OriginGame.LetsGoPikachu:
        case OriginGame.LetsGoEevee:
        case OriginGame.Sword:
        case OriginGame.Shield:
        case OriginGame.Home:
        case OriginGame.BrilliantDiamond:
        case OriginGame.ShiningPearl:
        case OriginGame.LegendsArceus:
        case OriginGame.Scarlet:
        case OriginGame.Violet:
        case OriginGame.LegendsZa:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }

        case OriginGame.Go:
          return { origin: OriginGame.Go, location: NotableLocations.PB7.GoPark }

        default:
          return { origin: ohpkm.gameOfOrigin, location: ohpkm.metLocationIndex }
      }

    default:
      return this.metLocationIndex(ohpkm)
  }
}
