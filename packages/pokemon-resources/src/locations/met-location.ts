import { GameSetting, Generation, OriginGame, OriginGames } from '@pkm-rs/pkg'

import { Gen2Locations } from './gen2'
import { Gen3GBALocations } from './gen3-gba'
import { Gen3GCNLocations } from './gen3-gcn'
import { Gen4Locations } from './gen4'
import { Gen5Locations } from './gen5'
import { Gen6Locations } from './gen6'
import { Gen7AlolaLocations } from './gen7-alola'
import { Gen7KantoLocations } from './gen7-kanto'
import { Gen8GalarLocations } from './gen8-galar'
import { Gen8HisuiLocations } from './gen8-hisui'
import { Gen8SinnohLocations } from './gen8-sinnoh'
import { Gen9LumioseLocations } from './gen9-lumiose'
import { Gen9PaldeaLocations } from './gen9-paldea'

export const getLocationString = (game: number, index: number, format: string, egg = false) => {
  if (game <= OriginGame.White && index === 30001) {
    return 'at the Poké Transfer Lab'
  }

  if (game === OriginGame.Go) {
    return 'in Pokémon GO'
  }

  const generation = OriginGames.generation(game)
  const gameSetting = OriginGames.gameSetting(game)

  let multiplier = 10000
  let locations: { [key: number]: string[] } = {}

  if (game >= OriginGame.Red && game <= OriginGame.Crystal) {
    locations = Gen2Locations
  } else if (format === 'PB7') {
    if (game < OriginGame.LetsGoPikachu || game > OriginGame.LetsGoEevee) {
      return game <= OriginGame.UltraMoon
        ? `in the ${OriginGames.gameSettingName(game)} region`
        : 'in a faraway place'
    }
    locations = Gen7KantoLocations
  } else if (format === 'PK8') {
    if (game !== OriginGame.Sword && game !== OriginGame.Sword) {
      return game <= OriginGame.LetsGoEevee
        ? `in the ${OriginGames.gameSettingName(game)} region`
        : 'in a faraway place'
    }
    locations = Gen8GalarLocations
  } else if (format === 'PB8') {
    if (game !== OriginGame.BrilliantDiamond && game !== OriginGame.ShiningPearl) {
      return game <= OriginGame.Shield
        ? `in the ${OriginGames.gameSettingName(game)} region`
        : 'in a faraway place'
    }
    locations = Gen8SinnohLocations
  } else if (game <= OriginGame.LeafGreen) {
    locations = Gen3GBALocations
  } else if (game === OriginGame.ColosseumXd) {
    locations = Gen3GCNLocations
  } else if (generation === Generation.G4) {
    multiplier = 1000
    locations = Gen4Locations
  } else if (generation === Generation.G5) {
    locations = Gen5Locations
  } else if (generation === Generation.G6) {
    locations = Gen6Locations
  } else if (gameSetting === GameSetting.Alola) {
    locations = Gen7AlolaLocations
  } else if (OriginGames.isLetsGo(game)) {
    locations = Gen7KantoLocations
  } else if (gameSetting === GameSetting.Galar) {
    locations = Gen8GalarLocations
  } else if (game === OriginGame.LegendsArceus) {
    locations = Gen8HisuiLocations
  } else if (OriginGames.isBdsp(game)) {
    locations = Gen8SinnohLocations
  } else if (gameSetting === GameSetting.Paldea) {
    locations = Gen9PaldeaLocations
  } else if (gameSetting === GameSetting.Lumiose) {
    locations = Gen9LumioseLocations
  }
  const locationBlock = locations[Math.floor(index / multiplier) * multiplier]
  if (locationBlock) {
    if (game === OriginGame.LegendsArceus) {
      return locationBlock[index % multiplier]
    }
    if (egg) {
      return `from ${locationBlock[index % multiplier]}`
    }
    const location = locationBlock[index % multiplier]
    if (location?.startsWith('Route')) {
      return `on ${location}`
    }
    return `in ${location}`
  }
  return index.toString()
}
