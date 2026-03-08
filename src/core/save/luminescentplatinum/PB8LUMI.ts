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
  public format: 'PB8' = 'PB8'
  public pluginIdentifier = 'luminescent_platinum' as PluginIdentifier
  public selectColor = '#213d68'

  static boxSizeBytes = 344

  // Preserves custom Luminescent forms (e.g. Stitched Gengar) during the OpenHome session
  public lumiFormeNum?: number

  // Custom form name used for UI display
  public lumiFormeName?: string

  public pluginOrigin?: PluginIdentifier

  constructor(arg: ArrayBuffer | AllPKMFields, encrypted?: boolean) {
    super(arg, encrypted)

    // When loading from raw save data, convert Luminescent indices to OpenHome indices
    if (arg instanceof ArrayBuffer) {
      // Translate held item index
      this.heldItemIndex = fromLumiItemIndex(this.heldItemIndex) ?? 0

      // Detect and preserve custom Luminescent forms
      const customForm = getLumiCustomForm(this.dexNum, this.formeNum)
      if (customForm) {
        // Store the original form so it can be restored when saving
        this.lumiFormeNum = this.formeNum
        this.lumiFormeName = customForm.name

        // Fallback to a base form so OpenHome processing does not break
        this.formeNum = customForm.fallbackForm
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
