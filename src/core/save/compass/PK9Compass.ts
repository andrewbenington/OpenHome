import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PK9 from '@openhome-core/pkm/PK9'
import { PkmConstructorOptions } from '@openhome-core/pkm/PKM'
import { getStats } from '@openhome-core/pkm/util/statCalc'
import { ConvertStrategy, OriginGames, PkmFormat } from '@pkm-rs/pkg'
import { PluginIdentifier } from '../interfaces'

const COMPASS_PLUGIN_ID = 'compass'

export default class PK9Compass extends PK9 implements PluginPKMInterface {
  static getFormat(): PkmFormat {
    return 'PK9Compass'
  }
  public format: PkmFormat = 'PK9Compass'
  public pluginOrigin?: PluginIdentifier
  public pluginIdentifier: PluginIdentifier = COMPASS_PLUGIN_ID
  public get selectColor() {
    return OriginGames.pluginColor(COMPASS_PLUGIN_ID)
  }

  constructor(arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions) {
    super(arg, options)

    if (arg instanceof ArrayBuffer) {
      this.pluginOrigin = COMPASS_PLUGIN_ID
    } else {
      if (arg.pluginOrigin === COMPASS_PLUGIN_ID) {
        this.pluginOrigin = COMPASS_PLUGIN_ID
      }
    }
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PK9Compass {
    return new PK9Compass(buffer, { encrypted })
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PK9Compass {
    return new PK9Compass(ohpkm, { strategy })
  }

  public getStats() {
    return getStats(this)
  }
}
