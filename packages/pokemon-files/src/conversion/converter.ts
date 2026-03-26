import { MonFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ConvertStrategies, ConvertStrategy } from '@pkm-rs/pkg'

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
}
