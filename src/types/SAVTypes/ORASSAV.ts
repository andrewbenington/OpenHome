import { ORAS_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G6SAV } from './G6SAV'
import { ParsedPath } from './path'

const PC_OFFSET = 0x33000
const PC_CHECKSUM_OFFSET = 0x75fda

export class ORASSAV extends G6SAV {
  static transferRestrictions = ORAS_TRANSFER_RESTRICTIONS

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(ORAS_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }
}
