import { OriginGame } from '@pkm-rs/pkg'
import { SM_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { Item } from '../../consts/Items'
import { isRestricted } from '../TransferRestrictions'
import { G7SAV } from './G7SAV'
import { PathData } from './path'

const PC_OFFSET = 0x04e00
const METADATA_OFFSET = 0x6be00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04800
const SAVE_SIZE_BYTES = 0x6be00

export class SMSAV extends G7SAV {
  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET, BOX_NAMES_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(SM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName: string = 'Pokémon Sun/Moon'
  static saveTypeID = 'SMSAV'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Sun || origin === OriginGame.Moon
  }
}
