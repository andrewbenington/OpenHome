import { BW_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { isRestricted } from '../TransferRestrictions'
import { G5SAV } from './G5SAV'

export class BWSAV extends G5SAV {
  static transferRestrictions = BW_TRANSFER_RESTRICTIONS

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(BW_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }
}
