import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { PB8 } from '@pokemon-files/pkm'
import { AllPKMFields } from '@pokemon-files/util'
import { PluginIdentifier } from '../interfaces'

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
  LumiToNationalDexMap,
  NationalDexToLumiMap,
  toLumiPokemonIndex,
} from './conversion/LuminescentPlatinumSpeciesMap'

export default class PB8LUMI extends PB8 implements PluginPKMInterface {
  // Core plugin metadata
  //@ts-ignore
  public format: 'PB8LUMI' = 'PB8LUMI'
  public pluginIdentifier = 'luminescent_platinum' as PluginIdentifier
  public selectColor = '#213d68'

  static boxSizeBytes = 344

  // Preserves custom Luminescent forms (e.g. Stitched Gengar)
  public lumiFormeNum?: number

  // Custom form name used for UI display
  public lumiFormeName?: string

  public pluginOrigin?: PluginIdentifier
  public pluginForm?: number

  constructor(arg: ArrayBuffer | AllPKMFields, encrypted?: boolean) {
    super(arg, encrypted)

    if (arg instanceof ArrayBuffer) {
      this.heldItemIndex = fromLumiItemIndex(this.heldItemIndex) ?? 0

      const customForm = getLumiCustomForm(this.dexNum, this.formeNum)
      if (customForm) {
        this.lumiFormeNum = this.formeNum
        this.lumiFormeName = customForm.name

        this.pluginForm = this.formeNum

        this.formeNum = customForm.fallbackForm
      }
    } else {
      if (arg.pluginForm !== undefined) {
        this.lumiFormeNum = arg.pluginForm
        this.pluginForm = arg.pluginForm

        const customForm = getLumiCustomForm(this.dexNum, arg.pluginForm)
        if (customForm) {
          this.lumiFormeName = customForm.name
        }
      }
    }
  }

  static getName() {
    return 'PB8LUMI'
  }

  toBytes(): ArrayBuffer {
    // Temporarily convert indices back to Luminescent values before serialization
    const standardItemIndex = this.heldItemIndex
    this.heldItemIndex = toLumiItemIndex(standardItemIndex) ?? 0

    const standardFormeNum = this.formeNum
    if (this.lumiFormeNum !== undefined) {
      this.formeNum = this.lumiFormeNum
    }

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
    return fromLumiPokemonIndex(gameIndex, LumiToNationalDexMap, 'Luminescent Platinum')
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toLumiPokemonIndex(nationalDexNumber, formIndex, NationalDexToLumiMap)
  }

  indexIsFakemon(_speciesIndex: number): boolean {
    return false
  }

  getPluginIdentifier(): PluginIdentifier {
    return this.pluginIdentifier
  }
}
