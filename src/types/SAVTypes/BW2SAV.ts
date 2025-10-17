import { OriginGame } from '@pkm-rs-resources/pkg'
import { BW2_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G5SAV } from './G5SAV'
import { hasDesamumeFooter } from './util'

export class BW2SAV extends G5SAV {
  static transferRestrictions = BW2_TRANSFER_RESTRICTIONS
  static saveTypeID = 'BW2SAV'

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(BW2_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
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
      bytes[G5SAV.originOffset] === OriginGame.White2 ||
      bytes[G5SAV.originOffset] === OriginGame.Black2
    )
  }

  static saveTypeName = 'Pokémon Black 2/White 2'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Black2 || origin === OriginGame.White2
  }
}
