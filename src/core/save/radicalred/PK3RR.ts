import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { ItemRadicalRed } from '@pkm-rs/pkg'
import PK3CFRU from '../cfru/PK3CFRU'

import {
  CfruSpeciesAndForm,
  fromGen3CRFUPokemonIndex,
  toGen3CRFUPokemonIndex,
} from '../cfru/conversion/util'
import { PluginIdentifier } from '../interfaces'
import { fromGen3RRMoveIndex, toGen3RRMoveIndex } from './conversion/Gen3RRMovesIndex'
import { RRToNationalMap } from './conversion/Gen3RRMovesIndex/RRToNationalMap'
import {
  NationalDexToRadicalRedMap,
  RadicalRedToNationalDexMap,
} from './conversion/RadicalRedSpeciesMap'

const CHILLET_INDEX = 1375

const VALID_MOVE_INDICES_RR = Object.values(RRToNationalMap).filter((index) => index > 0)

export default class PK3RR extends PK3CFRU implements PluginPKMInterface {
  format: 'PK3RR' = 'PK3RR'
  pluginIdentifier: PluginIdentifier = 'radical_red'

  selectColor = '#660000'

  static getName() {
    return 'PK3RR'
  }

  get heldItemIndex(): number {
    return ItemRadicalRed.fromIndex(this.internalHeldItemIndex)?.toModern()?.index ?? 0
  }

  internalItemIndexFromModern(modernIndex: number): number {
    return ItemRadicalRed.fromModern(modernIndex)?.index ?? 0
  }

  itemToString(index: number): string {
    return ItemRadicalRed.fromIndex(index)?.name ?? 'None'
  }

  moveFromGameIndex(gameIndex: number): number {
    return fromGen3RRMoveIndex(gameIndex) ?? 0
  }

  moveToGameIndex(nationalMoveId: number): number {
    return toGen3RRMoveIndex(nationalMoveId) ?? 0
  }

  getValidMoveIndices(): number[] {
    return VALID_MOVE_INDICES_RR
  }

  monFromGameIndex(gameIndex: number): CfruSpeciesAndForm {
    return fromGen3CRFUPokemonIndex(gameIndex, RadicalRedToNationalDexMap, 'Pokemon Radical Red')
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toGen3CRFUPokemonIndex(nationalDexNumber, formIndex, NationalDexToRadicalRedMap)
  }

  indexIsFakemon(speciesIndex: number): boolean {
    return speciesIndex === CHILLET_INDEX
  }

  getPluginIdentifier(): PluginIdentifier {
    return 'radical_red'
  }
}
