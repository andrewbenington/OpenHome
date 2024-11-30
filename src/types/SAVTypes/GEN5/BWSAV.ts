import { GameOfOrigin } from 'pokemon-resources'
import { BW_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { isRestricted } from '../../TransferRestrictions'
import { hasDesamumeFooter } from '../util'
import { G5SAV } from './G5SAV'

export class BWSAV extends G5SAV {
  static transferRestrictions = BW_TRANSFER_RESTRICTIONS

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(BW_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
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
      bytes[G5SAV.originOffset] === GameOfOrigin.White ||
      bytes[G5SAV.originOffset] === GameOfOrigin.Black
    )
  }

  static saveTypeName = 'Pokémon Black/White'

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.White || origin === GameOfOrigin.Black
  }
}
