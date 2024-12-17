import { Ball, GameOfOrigin } from 'pokemon-resources'

import { PluginPKMInterface } from '../../interfaces'
import PK3CFRU, { CFRUToNationalDexEntry } from '../cfru/PK3CFRU'

import { ItemGen3RRFromString, ItemGen3RRToString } from './conversion/Gen3RRItems'
import { fromGen3RRMoveIndex, toGen3RRMoveIndex } from './conversion/Gen3RRMovesIndex'
import { fromGen3RRPokemonIndex, toGen3RRPokemonIndex } from './conversion/Gen3RRPokemonIndex'

const FAKEMON_INDEXES = [
  1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
  1290, 1291, 1292, 1293, 1294, 1375,
]

const INTERNAL_ORIGIN_NON_RR = GameOfOrigin.INVALID_6
const INTERNAL_ORIGIN_FROM_RR = GameOfOrigin.FireRed
const FIRERED_IN_GAME_TRADE = 255

const RR_BALLS: Ball[] = [
  Ball.Master,
  Ball.Ultra,
  Ball.Great,
  Ball.Poke,
  Ball.Safari,
  Ball.Net,
  Ball.Dive,
  Ball.Nest,
  Ball.Repeat,
  Ball.Timer,
  Ball.Luxury,
  Ball.Premier,
  Ball.Dusk,
  Ball.Heal,
  Ball.Quick,
  Ball.Cherish,
  Ball.INVALID,
  Ball.Fast,
  Ball.Level,
  Ball.Lure,
  Ball.Heavy,
  Ball.Love,
  Ball.Friend,
  Ball.Moon,
  Ball.PokeHisui,
  Ball.Beast,
  Ball.Dream,
]

export class PK3RR extends PK3CFRU implements PluginPKMInterface {
  format: 'PK3RR' = 'PK3RR'
  pluginIdentifier: string = 'radical_red'

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
    return fromGen3RRPokemonIndex(gameIndex)
  }

  monToGameIndex(nationalDexNumber: number, formIndex: number): number {
    return toGen3RRPokemonIndex(nationalDexNumber, formIndex)
  }

  isFakemon(speciesIndex: number): boolean {
    return FAKEMON_INDEXES.includes(speciesIndex)
  }
}

export default PK3RR
