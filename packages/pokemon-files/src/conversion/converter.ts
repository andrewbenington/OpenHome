import { MonFormat } from '../../../../src/core/pkm/interfaces'
import { OHPKM } from '../../../../src/core/pkm/OHPKM'
import { ConversionStrategy, DefaultConversionStrategy, FullConversionStrategy } from './settings'

export class PkmConverter {
  format: MonFormat
  strategy: FullConversionStrategy

  constructor(format: MonFormat, strategy?: ConversionStrategy) {
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
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
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
}
