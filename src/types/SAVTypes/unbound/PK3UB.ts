import { PluginPKMInterface } from '../../interfaces'
import PK3CFRU, { CFRUToNationalDexEntry } from '../cfru/PK3CFRU'

import { fromGen3CFRUMoveIndex, toGen3CFRUMoveIndex } from '../cfru/conversion/Gen3CFRUMovesIndex'
import { fromGen3CRFUPokemonIndex, toGen3CRFUPokemonIndex } from '../cfru/conversion/util'
import { ItemGen3UnboundFromString, ItemGen3UnboundToString } from './conversion/Gen3UnboundItems'
import { NationalDexToUnboundMap, UnboundToNationalDexMap } from './conversion/UnboundSpeciesMap'

// const FAKEMON_INDEXES = [
//   1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
//   1290, 1291, 1292, 1293, 1294, 1375,
// ]
const FAKEMON_INDEXES: number[] = []

export class PK3UB extends PK3CFRU implements PluginPKMInterface {
  format: 'PK3UB' = 'PK3UB'
  pluginIdentifier: string = 'unbound'

  selectColor: string = '#c127fe'

  static getName() {
    return 'PK3UB'
  }

  itemFromString(itemName: string): number {
    return ItemGen3UnboundFromString(itemName)
  }

  itemToString(index: number): string {
    return ItemGen3UnboundToString(index)
  }

  moveFromGameIndex(gameIndex: number): number {
    return fromGen3CFRUMoveIndex(gameIndex)
  }

  moveToGameIndex(nationalMoveId: number): number {
    return toGen3CFRUMoveIndex(nationalMoveId)
  }

  monFromGameIndex(gameIndex: number): CFRUToNationalDexEntry {
    return fromGen3CRFUPokemonIndex(gameIndex, UnboundToNationalDexMap, 'Pokémon Unbound')
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toGen3CRFUPokemonIndex(nationalDexNumber, formIndex, NationalDexToUnboundMap)
  }

  indexIsFakemon(speciesIndex: number): boolean {
    return FAKEMON_INDEXES.includes(speciesIndex)
  }

  getPluginIdentifier(): string {
    return 'unbound'
  }
}

export default PK3UB
