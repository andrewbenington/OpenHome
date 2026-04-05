import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { PB8 } from '@pokemon-files/pkm'
import { PluginIdentifier } from '../interfaces'

import { Option } from '@openhome-core/util/functional'
import { ConvertStrategy, ExtraFormIndex, luminescentSupportsExtraForm } from '@pkm-rs/pkg'
import { PkmConstructorOptions } from '../../../../packages/pokemon-files/src/pkm/PKM'
import { OHPKM } from '../../pkm/OHPKM'
import { getLumiCustomForm as getLumiExtraFormIndex } from './conversion/LuminescentPlatinumFormMap'
import {
  fromLumiItemIndex,
  LUMI_ITEM_NAMES,
  toLumiItemIndex,
} from './conversion/LuminescentPlatinumItemMap'
import {
  fromLumiMoveIndex,
  toLumiMoveIndex,
  VALID_MOVE_INDICES_LUMI,
} from './conversion/LuminescentPlatinumMovesIndex'
import {
  fromLumiPokemonIndex,
  toLumiPokemonIndex,
} from './conversion/LuminescentPlatinumSpeciesMap'

export default class PB8LUMI extends PB8 implements PluginPKMInterface {
  // Core plugin metadata
  // @ts-expect-error PB8 declares format as literal 'PB8'; plugin subclass intentionally widens to 'PB8LUMI'
  public format: 'PB8LUMI' = 'PB8LUMI'
  public pluginOrigin?: PluginIdentifier
  public pluginIdentifier: PluginIdentifier = 'luminescent_platinum'
  public selectColor = '#25c2a0'

  public lumiFormIndex: number

  static boxSizeBytes = 344

  public extraFormIndex: Option<ExtraFormIndex>

  constructor(arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions) {
    super(arg, options)
    this.lumiFormIndex = this.formeNum

    if (arg instanceof ArrayBuffer) {
      this.pluginOrigin = 'luminescent_platinum'
      this.heldItemIndex = fromLumiItemIndex(this.heldItemIndex) ?? 0

      const extraFormIndex = getLumiExtraFormIndex(this.dexNum, this.formeNum)
      if (extraFormIndex) {
        this.extraFormIndex = extraFormIndex.extraFormIndex
        this.formeNum = extraFormIndex.fallbackForm
      }
    } else {
      if (arg.pluginOrigin === 'luminescent_platinum') {
        this.pluginOrigin = 'luminescent_platinum'
      }
      if (arg.extraFormIndex && luminescentSupportsExtraForm(arg.extraFormIndex)) {
        this.extraFormIndex = arg.extraFormIndex
      }
    }
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PB8LUMI {
    return new PB8LUMI(buffer, { encrypted })
  }

  static fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PB8LUMI {
    return new PB8LUMI(ohpkm, { strategy })
  }

  static getName() {
    return 'PB8LUMI'
  }

  toBytes(): ArrayBuffer {
    const buffer = super.toBytes()
    const dataView = new DataView(buffer)
    dataView.setUint16(0x24, this.lumiFormIndex, true)
    dataView.setUint16(0xa, toLumiItemIndex(this.heldItemIndex), true)

    return buffer
  }

  itemToString(index: number): string {
    return LUMI_ITEM_NAMES[index] ?? `Item ${index}`
  }

  moveFromGameIndex(gameIndex: number): number {
    return fromLumiMoveIndex(gameIndex) ?? 0
  }

  moveToGameIndex(nationalMoveId: number): number {
    return toLumiMoveIndex(nationalMoveId) ?? 0
  }

  getValidMoveIndices(): number[] {
    return VALID_MOVE_INDICES_LUMI
  }

  monFromGameIndex(gameIndex: number) {
    return fromLumiPokemonIndex(gameIndex)
  }

  monToGameIndex(nationalDexNumber: number): number {
    return toLumiPokemonIndex(nationalDexNumber)
  }

  indexIsFakemon(_speciesIndex: number): boolean {
    return false
  }

  getPluginIdentifier(): PluginIdentifier {
    return this.pluginIdentifier
  }
}
