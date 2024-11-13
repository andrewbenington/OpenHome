import { SM_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { G7SAV } from './G7SAV'

export class SMSAV extends G7SAV {
  static transferRestrictions = SM_TRANSFER_RESTRICTIONS
}
