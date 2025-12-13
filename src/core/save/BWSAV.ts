import { OriginGame } from '@pkm-rs/pkg'
import { Item } from '@pokemon-resources/consts/Items'
import { BW_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { isRestricted } from 'src/core/save/util/TransferRestrictions'
import { G5SAV } from './G5SAV'
import { hasDesamumeFooter } from './util/util'

export class BWSAV extends G5SAV {
  static transferRestrictions = BW_TRANSFER_RESTRICTIONS

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(BW_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.Xtransceiver
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G5SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G5SAV.SAVE_SIZE_BYTES) {
      if (!hasDesamumeFooter(bytes, G5SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    return (
      bytes[G5SAV.originOffset] === OriginGame.White ||
      bytes[G5SAV.originOffset] === OriginGame.Black
    )
  }

  static saveTypeName = 'Pokémon Black/White'
  static saveTypeID = 'BWSAV'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.White || origin === OriginGame.Black
  }
}
