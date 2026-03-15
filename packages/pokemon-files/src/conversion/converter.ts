import { Generation, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { MonFormat } from '../../../../src/core/pkm/interfaces'
import { OHPKM } from '../../../../src/core/pkm/OHPKM'
import { ConvertStrategy, DefaultConversionStrategy, FullConversionStrategy } from './settings'

export class PkmConverter {
  format: MonFormat
  strategy: FullConversionStrategy

  constructor(format: MonFormat, strategy?: ConvertStrategy) {
    this.format = format
    this.strategy = { ...DefaultConversionStrategy, ...strategy }
  }

  nickname(ohpkm: OHPKM): string {
    const speciesName = ohpkm.speciesMetadata?.name
    if (!speciesName || ohpkm.nickname.toUpperCase() !== speciesName.toUpperCase()) {
      console.log(
        `Nickname "${ohpkm.nickname}" does not match species name "${speciesName}", so it will be preserved as-is.`
      )
      return ohpkm.nickname
    }

    const capitalizationSetting = this.strategy['nickname.capitalization']
    if (capitalizationSetting === 'modern') {
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

  metLocation(ohpkm: OHPKM): number | undefined {
    if (OriginGames.generation(ohpkm.gameOfOrigin) === Generation.G4) {
      if (this.format === 'PK4') {
        return ohpkm.metLocationIndex
      }
    }
  }
}

function originMatchesFormat(gameOfOrigin: OriginGame, format: MonFormat): boolean {
  const generation = OriginGames.generation(gameOfOrigin)
  switch (format) {
    case 'PK1':
      return generation === Generation.G1
    case 'PK2':
      return generation === Generation.G2
    case 'PK3':
      return generation === Generation.G3
    case 'COLOPKM':
      return generation === Generation.G3
    case 'XDPKM':
      return generation === Generation.G3
    case 'PK4':
      return generation === Generation.G4
    case 'PK5':
      return generation === Generation.G5
    case 'PK6':
      return generation === Generation.G6
    case 'PK7':
      return generation === Generation.G7
    case 'PB7':
      return generation === Generation.G7
    case 'PK8':
      return generation === Generation.G8
    case 'PA8':
      return generation === Generation.G8
    case 'PB8':
      return generation === Generation.G8
    case 'PK9':
      return generation === Generation.G9
    case 'PA9':
      return generation === Generation.G9
    default:
      throw new Error(`Unknown format ${format}`)
  }
}
