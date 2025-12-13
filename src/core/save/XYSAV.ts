import { OriginGame } from '@pkm-rs/pkg'
import { Item } from '@pokemon-resources/consts/Items'
import { XY_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { isRestricted } from 'src/core/save/util/TransferRestrictions'
import { G6SAV } from './G6SAV'
import { PathData } from './util/path'

const PC_OFFSET = 0x22600
const PC_CHECKSUM_OFFSET = 0x655c2
const SAVE_SIZE_BYTES = 0x65600

export class XYSAV extends G6SAV {
  static transferRestrictions = XY_TRANSFER_RESTRICTIONS

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PC_OFFSET, PC_CHECKSUM_OFFSET)
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(XY_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.MegaGlove
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName = 'Pokémon X/Y'
  static saveTypeID = 'XYSAV'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.X || origin === OriginGame.Y
  }
}
