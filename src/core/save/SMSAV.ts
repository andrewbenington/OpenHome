import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { OriginGame } from '@pkm-rs/pkg'
import { Item } from '@pokemon-resources/consts/Items'
import { SM_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { G7SAV } from './G7SAV'
import { PathData } from './util/path'

const PC_OFFSET = 0x04e00
const METADATA_OFFSET = 0x6be00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04800
const SAVE_SIZE_BYTES = 0x6be00

export class SMSAV extends G7SAV {
  pcChecksumOffset: number = PC_CHECKSUM_OFFSET

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)
  }

  getBoxNamesOffset(): number {
    return BOX_NAMES_OFFSET
  }

  getPcOffset(): number {
    return PC_OFFSET
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
