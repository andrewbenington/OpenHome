import { G3CFRUSAV } from '../cfru/G3CFRUSAV'
import { PathData } from '../path'
import { PluginSAV } from '../SAV'
import PK3UB from './PK3UB'

export class G3UBSAV extends G3CFRUSAV<PK3UB> implements PluginSAV<PK3UB> {
  //   static transferRestrictions: TransferRestrictions = RR_TRANSFER_RESTRICTIONS

  pluginIdentifier = 'radical_red'

  static saveTypeAbbreviation = 'Radical Red'
  static saveTypeName = 'Pokémon Radical Red'
  static saveTypeID = 'G3RRSAV'

  supportsMon(_dexNumber: number, _formeNumber: number) {
    return true // !isRestricted(RR_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  getPluginIdentifier() {
    return 'radical_red'
  }

  getGameName() {
    return 'Pokémon Radical Red'
  }

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PK3UB)
  }
}
