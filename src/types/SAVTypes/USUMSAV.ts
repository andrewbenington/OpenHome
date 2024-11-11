import { USUM_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G7SAV } from './G7SAV'
import { ParsedPath } from './path'

const PC_OFFSET = 0x05200
const METADATA_OFFSET = 0x6cc00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6

export class USUMSAV extends G7SAV {
  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(USUM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }
}
