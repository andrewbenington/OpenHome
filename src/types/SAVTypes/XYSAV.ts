import { XY_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G6SAV } from './G6SAV'
import { ParsedPath } from './path'

const PC_OFFSET = 0x22600
const PC_CHECKSUM_OFFSET = 0x655c2
const SAVE_SIZE_BYTES = 0x65600

export class XYSAV extends G6SAV {
  static transferRestrictions = XY_TRANSFER_RESTRICTIONS

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(XY_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }
}