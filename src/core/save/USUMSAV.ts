import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { OriginGame } from '@pkm-rs/pkg'
import { Item } from '@pokemon-resources/consts/Items'
import { USUM_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { G7SAV } from './G7SAV'
import { PathData } from './util/path'

const PC_OFFSET = 0x05200
const METADATA_OFFSET = 0x6cc00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04c00
const SAVE_SIZE_BYTES = 0x6cc00

export class USUMSAV extends G7SAV {
  boxNamesOffset: number = BOX_NAMES_OFFSET
  static saveTypeID = 'USUMSAV'

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
    return !isRestricted(USUM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.RotoCatch
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName = 'Pokémon Ultra Sun/Ultra Moon'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.UltraSun || origin === OriginGame.UltraMoon
  }
}
