import { BW_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { G5SAV } from './G5SAV'

export class BWSAV extends G5SAV {
  static transferRestrictions = BW_TRANSFER_RESTRICTIONS
}
