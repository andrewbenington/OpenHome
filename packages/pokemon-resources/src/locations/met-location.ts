import { Generation, OriginGame, OriginGames, Region } from '@pkm-rs-resources/pkg'

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
import { Gen9Locations } from './gen9'

export const getLocationString = (game: number, index: number, format: string, egg = false) => {
  if (game <= OriginGame.White && index === 30001) {
    return 'at the Poké Transfer Lab'
  }

  if (game === OriginGame.Go) {
    return 'in Pokémon GO'
  }

  const generation = OriginGames.generation(game)
  const region = OriginGames.region(game)

  let multiplier = 10000
  let locations: { [key: number]: string[] } = {}

  if (game >= OriginGame.Red && game <= OriginGame.Crystal) {
    locations = Gen2Locations
  } else if (format === 'PB7') {
    if (game < OriginGame.LetsGoPikachu || game > OriginGame.LetsGoEevee) {
      return game <= OriginGame.UltraMoon
        ? `in the ${OriginGames.regionName(game)} region`
        : 'in a faraway place'
    }
    locations = Gen7KantoLocations
  } else if (format === 'PK8') {
    if (game !== OriginGame.Sword && game !== OriginGame.Sword) {
      return game <= OriginGame.LetsGoEevee
        ? `in the ${OriginGames.regionName(game)} region`
        : 'in a faraway place'
    }
    locations = Gen8GalarLocations
  } else if (format === 'PB8') {
    if (game !== OriginGame.BrilliantDiamond && game !== OriginGame.ShiningPearl) {
      return game <= OriginGame.Shield
        ? `in the ${OriginGames.regionName(game)} region`
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
  } else if (region === Region.Alola) {
    locations = Gen7AlolaLocations
  } else if (OriginGames.isLetsGo(game)) {
    locations = Gen7KantoLocations
  } else if (region === Region.Galar) {
    locations = Gen8GalarLocations
  } else if (game === OriginGame.LegendsArceus) {
    locations = Gen8HisuiLocations
  } else if (OriginGames.isBdsp(game)) {
    locations = Gen8SinnohLocations
  } else if (generation === Generation.G9) {
    locations = Gen9Locations
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

export function getMetLocation(
  index: number,
  source: { origin?: OriginGame; fileFormat?: string }
): string {
  const { origin, fileFormat } = source

  if (!origin) return ''

  const generation = OriginGames.generation(origin)
  const region = OriginGames.region(origin)

  if (generation === Generation.G2 || fileFormat === 'PK2') {
    return Gen2Locations[0][index]
  }

  if (OriginGames.isGba(origin) || fileFormat === 'PK3') {
    return Gen3GBALocations[0][index]
  }

  if (origin === OriginGame.ColosseumXd || fileFormat === 'COLOPKM' || fileFormat === 'XDPKM') {
    return Gen3GCNLocations[0][index]
  }

  if (generation === Generation.G4 || fileFormat === 'PK4') {
    return Gen4Locations[Math.floor(index / 1000) * 1000][index % 1000]
  }

  if (generation === Generation.G5 || fileFormat === 'PK5') {
    return Gen5Locations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (generation === Generation.G6 || fileFormat === 'PK6') {
    return Gen6Locations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (region === Region.Alola || fileFormat === 'PK7') {
    return Gen7AlolaLocations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (OriginGames.isLetsGo(origin) || fileFormat === 'PB7') {
    return Gen7KantoLocations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (region === Region.Galar || fileFormat === 'PK8') {
    return Gen8GalarLocations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (OriginGames.isBdsp(origin) || fileFormat === 'PB8') {
    return Gen8SinnohLocations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (origin === OriginGame.LegendsArceus || fileFormat === 'PA8') {
    return Gen8HisuiLocations[Math.floor(index / 10000) * 10000][index % 10000]
  }

  if (OriginGames.isScarletViolet(origin) || fileFormat === 'PK9') {
    return Gen9Locations[Math.floor(index / 10000) * 10000][index % 10000]
  }
  return ''
}
