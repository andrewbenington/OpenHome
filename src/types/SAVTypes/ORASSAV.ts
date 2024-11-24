import { GameOfOrigin } from 'pokemon-resources'
import { ORAS_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G6SAV } from './G6SAV'
import { PathData } from './path'

const PC_OFFSET = 0x33000
const PC_CHECKSUM_OFFSET = 0x75fda
const SAVE_SIZE_BYTES = 0x76000

export class ORASSAV extends G6SAV {
  static transferRestrictions = ORAS_TRANSFER_RESTRICTIONS

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(ORAS_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName = 'Pokémon Omega Ruby/Alpha Sapphire'

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.OmegaRuby || origin === GameOfOrigin.AlphaSapphire
  }
}
