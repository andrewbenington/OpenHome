import { NationalDex } from 'pokemon-species-data'
import { ORIGIN, SPIKY_EAR } from '../../../consts/Formes'
import { CapPikachus, isRestricted, TransferRestrictions } from '../../TransferRestrictions'
import { G3CFRUSAV } from '../cfru/G3CFRUSAV'
import { PathData } from '../path'
import { PluginSAV } from '../SAV'
import { RRTransferMon } from './conversion/RRTransferMons'
import PK3RR from './PK3RR'

// https://docs.google.com/spreadsheets/d/15mUFUcN8250hRL7iUOJPX0s1rMcgVuJPuHANioL4o2o/edit?gid=45654363#gid=962831839
const RR_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  transferableDexNums: RRTransferMon,
  excludedForms: {
    ...CapPikachus,
    [NationalDex.Pichu]: [SPIKY_EAR],
    [NationalDex.Dialga]: [ORIGIN],
    [NationalDex.Palkia]: [ORIGIN],
  },
}

export class G3RRSAV extends G3CFRUSAV<PK3RR> implements PluginSAV<PK3RR> {
  static transferRestrictions: TransferRestrictions = RR_TRANSFER_RESTRICTIONS

  pluginIdentifier = 'radical_red'

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(RR_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PK3RR)
  }

  static pkmType = PK3RR
}
