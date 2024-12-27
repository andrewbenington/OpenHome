import { PluginPKMInterface } from '../../interfaces'
import PK3CFRU, { CFRUToNationalDexEntry } from '../cfru/PK3CFRU'

import { fromGen3CRFUPokemonIndex, toGen3CRFUPokemonIndex } from '../cfru/conversion/util'
import { ItemGen3RRFromString, ItemGen3RRToString } from './conversion/Gen3RRItems'
import { fromGen3RRMoveIndex, toGen3RRMoveIndex } from './conversion/Gen3RRMovesIndex'
import {
  NationalDexToRadicalRedMap,
  RadicalRedToNationalDexMap,
} from './conversion/RadicalRedSpeciesMap'

const FAKEMON_INDEXES = [
  1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
  1290, 1291, 1292, 1293, 1294, 1375,
]

export class PK3RR extends PK3CFRU implements PluginPKMInterface {
  format: 'PK3RR' = 'PK3RR'
  pluginIdentifier: string = 'radical_red'

  selectColor = '#660000'

  static getName() {
    return 'PK3RR'
  }

  itemFromString(itemName: string): number {
    return ItemGen3RRFromString(itemName)
  }

  itemToString(index: number): string {
    return ItemGen3RRToString(index)
  }

  moveFromGameIndex(gameIndex: number): number {
    return fromGen3RRMoveIndex(gameIndex)
  }

  moveToGameIndex(nationalMoveId: number): number {
    return toGen3RRMoveIndex(nationalMoveId)
  }

  monFromGameIndex(gameIndex: number): CFRUToNationalDexEntry {
    return fromGen3CRFUPokemonIndex(gameIndex, RadicalRedToNationalDexMap)
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toGen3CRFUPokemonIndex(nationalDexNumber, formIndex, NationalDexToRadicalRedMap)
  }

  isFakemon(speciesIndex: number): boolean {
    return FAKEMON_INDEXES.includes(speciesIndex)
  }

  getPluginIdentifier(): string {
    return 'radical_red'
  }
}

export default PK3RR
