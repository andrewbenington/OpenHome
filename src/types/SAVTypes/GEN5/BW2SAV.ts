import { BW2_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { G5SAV } from './G5SAV'

export class BW2SAV extends G5SAV {
  static transferRestrictions = BW2_TRANSFER_RESTRICTIONS
}
