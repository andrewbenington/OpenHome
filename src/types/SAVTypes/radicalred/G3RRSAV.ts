import { bytesToUint32LittleEndian } from '../../../util/byteLogic'
import { isRestricted, TransferRestrictions } from '../../TransferRestrictions'
import { findFirstSectionOffset, G3CFRUSAV, SAVE_SIZES_BYTES } from '../cfru/G3CFRUSAV'
import { FRLG_SECURITY_COPY_OFFSET, FRLG_SECURITY_OFFSET } from '../G3SAV'
import { PathData } from '../path'
import { PluginSAV } from '../SAV'
import { RRExcludedForms, RRTransferMon } from './conversion/RRTransferMons'
import PK3RR from './PK3RR'

// https://docs.google.com/spreadsheets/d/15mUFUcN8250hRL7iUOJPX0s1rMcgVuJPuHANioL4o2o/edit?gid=45654363#gid=962831839
const RR_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  transferableDexNums: RRTransferMon,
  excludedForms: RRExcludedForms,
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

  static fileIsSave(bytes: Uint8Array): boolean {
    if (!SAVE_SIZES_BYTES.includes(bytes.length)) {
      return false
    }

    const firstSectionBytesIndex = findFirstSectionOffset(bytes)
    const firstSectionBytes = bytes.slice(firstSectionBytesIndex, firstSectionBytesIndex + 0x1000)

    const gameCode = firstSectionBytes[0xac]

    if (gameCode !== 1) return false

    const securityKey = bytesToUint32LittleEndian(firstSectionBytes, FRLG_SECURITY_OFFSET)
    const securityKeyCopy = bytesToUint32LittleEndian(firstSectionBytes, FRLG_SECURITY_COPY_OFFSET)

    // Radical Red seems to have the security key set to 0, which has a 1 in 4.2 billion
    // chance to happen in vanilla FireRed (if it can even be 0 at all)
    return securityKey === 0 || securityKey !== securityKeyCopy
  }

  gameColor(): string {
    return '#660000'
  }
}
