import { PluginPKMInterface } from '../../interfaces'
import PK3CFRU, { CFRUToNationalDexEntry } from '../cfru/PK3CFRU'

import { ItemGen3CFRUFromString, ItemGen3CFRUToString } from '../cfru/conversion/Gen3CFRUItems'
import { fromGen3CFRUMoveIndex, toGen3CFRUMoveIndex } from '../cfru/conversion/Gen3CFRUMovesIndex'
import { fromGen3CRFUPokemonIndex, toGen3CRFUPokemonIndex } from '../cfru/conversion/util'
import { NationalDexToUnboundMap, UnboundToNationalDexMap } from './conversion/UnboundSpeciesMap'

// const FAKEMON_INDEXES = [
//   1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
//   1290, 1291, 1292, 1293, 1294, 1375,
// ]
const FAKEMON_INDEXES: number[] = []

export class PK3UB extends PK3CFRU implements PluginPKMInterface {
  format: 'PK3UB' = 'PK3UB'
  pluginIdentifier: string = 'unbound'

  itemFromString(itemName: string): number {
    return ItemGen3CFRUFromString(itemName)
  }

  itemToString(index: number): string {
    return ItemGen3CFRUToString(index)
  }

  moveFromGameIndex(gameIndex: number): number {
    return fromGen3CFRUMoveIndex(gameIndex)
  }

  moveToGameIndex(nationalMoveId: number): number {
    return toGen3CFRUMoveIndex(nationalMoveId)
  }

  monFromGameIndex(gameIndex: number): CFRUToNationalDexEntry {
    return fromGen3CRFUPokemonIndex(gameIndex, UnboundToNationalDexMap)
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toGen3CRFUPokemonIndex(nationalDexNumber, formIndex, NationalDexToUnboundMap)
  }

  isFakemon(speciesIndex: number): boolean {
    return FAKEMON_INDEXES.includes(speciesIndex)
  }
}

export default PK3UB
