import { Item } from '@openhome-core/resources/consts/Items'
import { BW2_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { G5SAV } from '@openhome-core/save/G5SAV'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { ExtraFormIndex, OriginGame } from '@pkm-rs/pkg'
import { hasDesmumeFooter } from './util'

export class BW2SAV extends G5SAV {
  static transferRestrictions = BW2_TRANSFER_RESTRICTIONS
  static saveTypeID = 'BW2SAV'

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return false
    return !isRestricted(BW2_TRANSFER_RESTRICTIONS, dexNumber, formeNumber, extraFormIndex)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.RevealGlass
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G5SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G5SAV.SAVE_SIZE_BYTES) {
      if (!hasDesmumeFooter(bytes, G5SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    return (
      bytes[G5SAV.originOffset] === OriginGame.White2 ||
      bytes[G5SAV.originOffset] === OriginGame.Black2
    )
  }
  static saveTypeName = 'Pokémon Black 2/White 2'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Black2 || origin === OriginGame.White2
  }
}
