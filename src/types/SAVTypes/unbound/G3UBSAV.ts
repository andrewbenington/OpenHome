import { NationalDex } from 'src/consts/NationalDex'
import { bytesToUint32LittleEndian } from '../../../util/byteLogic'
import { isRestricted, TransferRestrictions } from '../../TransferRestrictions'
import { findFirstSectionOffset, G3CFRUSAV, SAVE_SIZES_BYTES } from '../cfru/G3CFRUSAV'
import { PathData } from '../path'
import { PluginSAV } from '../SAV'
import PK3UB from './PK3UB'

const UB_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NationalDex.Enamorus,
}

export class G3UBSAV extends G3CFRUSAV<PK3UB> implements PluginSAV<PK3UB> {
  static transferRestrictions: TransferRestrictions = UB_TRANSFER_RESTRICTIONS

  pluginIdentifier = 'unbound'

  static saveTypeAbbreviation = 'Unbound'
  static saveTypeName = 'Pokémon Unbound'
  static saveTypeID = 'G3UBSAV'

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(UB_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  getPluginIdentifier() {
    return 'unbound'
  }

  getGameName() {
    return 'Pokémon Unbound'
  }

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes, PK3UB)
  }

  static pkmType = PK3UB

  static fileIsSave(bytes: Uint8Array): boolean {
    if (!SAVE_SIZES_BYTES.includes(bytes.length)) {
      return false
    }

    const firstSectionBytesIndex = findFirstSectionOffset(bytes)
    const firstSectionBytes = bytes.slice(firstSectionBytesIndex, firstSectionBytesIndex + 0x1000)

    const signature = bytesToUint32LittleEndian(firstSectionBytes, 0x0ff8)

    // from unbound cloud
    // https://github.com/Skeli789/Unbound-Cloud/blob/a5d966b74b865f51fef608e19ca63e0e51593f5e/server/src/Defines.py#L25C1-L26C1
    return signature === 0x01122000 || signature === 0x01121999 || signature === 0x01121998
  }

  gameColor(): string {
    return '#c127fe'
  }
}
