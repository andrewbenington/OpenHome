import { GameOfOrigin } from 'pokemon-resources'
import { BW2_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G5SAV } from './G5SAV'
import { hasDesamumeFooter } from './util'

export class BW2SAV extends G5SAV {
  static transferRestrictions = BW2_TRANSFER_RESTRICTIONS

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
      bytes[G5SAV.originOffset] === GameOfOrigin.White2 ||
      bytes[G5SAV.originOffset] === GameOfOrigin.Black2
    )
  }

  static saveTypeName = 'Pokémon Black 2/White 2'
}
