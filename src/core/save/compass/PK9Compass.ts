import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import PK9 from '@openhome-core/pkm/PK9'
import { PkmConstructorOptions } from '@openhome-core/pkm/PKM'
import { modernStatCalc } from '@openhome-core/pkm/util'
import { Errorable, R } from '@openhome-core/util/functional'
import { ConvertStrategy, OriginGames, Pk9Wasm, PkmFormat } from '@pkm-rs/pkg'
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

  constructor(arg: Pk9Wasm | OHPKM, options: PkmConstructorOptions) {
    super(arg, options)

    if (arg instanceof Pk9Wasm) {
      this.pluginOrigin = COMPASS_PLUGIN_ID
    } else {
      if (arg.pluginOrigin === COMPASS_PLUGIN_ID) {
        this.pluginOrigin = COMPASS_PLUGIN_ID
      }
    }
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PK9Compass {
    const byteArray = new Uint8Array(buffer)
    return PK9Compass.fromWasm(
      encrypted ? Pk9Wasm.fromEncryptedBytes(byteArray) : Pk9Wasm.fromBytes(byteArray)
    )
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK9Compass> {
    return R.tryFrom(() => new PK9Compass(ohpkm, { strategy }))
  }

  static fromWasm(pk9: Pk9Wasm): PK9Compass {
    return new PK9Compass(pk9, {})
  }

  public getStats() {
    return modernStatCalc(this)
  }
}
