import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { PB8 } from '@pokemon-files/pkm'
import { PluginIdentifier } from '../interfaces'

import {
  ConversionStrategy,
  DefaultConversionStrategy,
} from '../../../../packages/pokemon-files/src/conversion/settings'
import {
  DefaultConstructorOptions,
  PkmConstructorOptions,
} from '../../../../packages/pokemon-files/src/pkm/PKM'
import { OHPKM } from '../../pkm/OHPKM'
import { getLumiCustomForm } from './conversion/LuminescentPlatinumFormMap'
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
  public pluginIdentifier: PluginIdentifier = 'luminescent_platinum'
  public selectColor = '#25c2a0'

  static boxSizeBytes = 344

  public pluginOrigin?: PluginIdentifier
  public pluginForm?: number

  constructor(
    arg: ArrayBuffer | OHPKM,
    options: PkmConstructorOptions = DefaultConstructorOptions
  ) {
    super(arg, options)
    this.pluginOrigin = 'luminescent_platinum'

    if (arg instanceof ArrayBuffer) {
      this.heldItemIndex = fromLumiItemIndex(this.heldItemIndex) ?? 0

      const customForm = getLumiCustomForm(this.dexNum, this.formeNum)
      if (customForm) {
        this.pluginForm = this.formeNum
        this.formeNum = customForm.fallbackForm
      }
    } else {
      if (arg.pluginOrigin === 'luminescent_platinum') {
        this.pluginForm = arg.pluginForm
      }
    }
  }

  static fromBytes(buffer: ArrayBuffer, encrypted?: boolean): PB8LUMI {
    return new PB8LUMI(buffer, { encrypted })
  }

  static fromOhpkm(
    ohpkm: OHPKM,
    strategy: ConversionStrategy = DefaultConversionStrategy
  ): PB8LUMI {
    return new PB8LUMI(ohpkm, { strategy })
  }

  static getName() {
    return 'PB8LUMI'
  }

  toBytes(): ArrayBuffer {
    // Temporarily convert indices back to Luminescent values before serialization
    const standardItemIndex = this.heldItemIndex
    const standardFormeNum = this.formeNum

    this.heldItemIndex = toLumiItemIndex(standardItemIndex) ?? 0
    this.formeNum = this.pluginForm ?? this.formeNum

    const buffer = super.toBytes()

    // Restore OpenHome indices after serialization
    this.heldItemIndex = standardItemIndex
    this.formeNum = standardFormeNum

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
