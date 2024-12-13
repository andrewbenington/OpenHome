import { PK4 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { PT_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from 'src/util/byteLogic'
import { gen4StringToUTF } from 'src/util/Strings/StringConverter'
import { isRestricted } from '../TransferRestrictions'
import { G4SAV } from './G4SAV'
import { PathData } from './path'
import { hasDesamumeFooter } from './util'

export class PtSAV extends G4SAV {
  static pkmType = PK4

  name: string
  tid: number
  sid: number
  displayID: string

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  origin = GameOfOrigin.Platinum

  static transferRestrictions = PT_TRANSFER_RESTRICTIONS

  static TRAINER_NAME_OFFSET = 0x68

  static TRAINER_ID_OFFSET = 0x78

  static BOX_SIZE = 0xff0

  static GENERAL_BLOCK_OFFSET = 0x0000

  static GENERAL_BLOCK_SIZE = 0xcf2c

  static STORAGE_BLOCK_OFFSET = 0xcf2c

  static STORAGE_BLOCK_SIZE = 0x121e4

  static BOX_NAMES_OFFSET = 0x11ee0

  currentSaveStorageBlockOffset: number = PtSAV.STORAGE_BLOCK_OFFSET

  storageBlockSize: number = PtSAV.STORAGE_BLOCK_SIZE

  boxSize: number = PtSAV.BOX_SIZE

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(PtSAV.STORAGE_BLOCK_OFFSET, PtSAV.STORAGE_BLOCK_SIZE) <
      this.getCurrentSaveCount(PtSAV.STORAGE_BLOCK_OFFSET + 0x40000, PtSAV.STORAGE_BLOCK_SIZE)
    ) {
      this.currentSaveStorageBlockOffset += 0x40000
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset + 4
    this.boxNamesOffset = this.currentSaveStorageBlockOffset + PtSAV.BOX_NAMES_OFFSET
    this.name = gen4StringToUTF(bytes, PtSAV.TRAINER_NAME_OFFSET, 8)
    this.tid = bytesToUint16LittleEndian(bytes, PtSAV.TRAINER_ID_OFFSET)
    this.sid = bytesToUint16LittleEndian(bytes, PtSAV.TRAINER_ID_OFFSET + 2)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.buildBoxes()
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    return bytesToUint32LittleEndian(this.bytes, blockOffset + blockSize - this.footerSize)
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(PT_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G4SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G4SAV.SAVE_SIZE_BYTES) {
      if (!hasDesamumeFooter(bytes, G4SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    return G4SAV.validDateAndSize(bytes, 0x4cf2c)
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.Platinum
  }
}
