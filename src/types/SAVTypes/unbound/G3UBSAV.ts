import { NationalDex } from 'pokemon-species-data'
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

    const gameCode = firstSectionBytes[0xac]

    return gameCode === 255

    // const securityKey = bytesToUint32LittleEndian(firstSectionBytes, FRLG_SECURITY_OFFSET)
    // const securityKeyCopy = bytesToUint32LittleEndian(firstSectionBytes, FRLG_SECURITY_COPY_OFFSET)

    // console.log('UNBOUND SEC KEY', securityKey, securityKey === 0, securityKey !== securityKeyCopy)

    // // Radical Red seems to have the security key set to 0, which has a 1 in 4.2 billion
    // // chance to happen in vanilla FireRed (if it can even be 0 at all)
    // return securityKey === 0 || securityKey !== securityKeyCopy
  }

  gameColor(): string {
    return '#c127fe'
  }
}
