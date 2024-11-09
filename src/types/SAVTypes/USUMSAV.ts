import { USUM_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { G7SAV } from './G7SAV'

export class USUMSAV extends G7SAV {
  static transferRestrictions = USUM_TRANSFER_RESTRICTIONS
}
