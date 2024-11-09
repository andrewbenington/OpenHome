import { PK4 } from 'pokemon-files'
import { DP_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from '../../util/ByteLogic'
import { gen4StringToUTF } from '../../util/Strings/StringConverter'
import { SaveType } from '../types'
import { G4SAV } from './G4SAV'
import { ParsedPath } from './path'

export class DPSAV extends G4SAV {
  static saveType = SaveType.DP
  static pkmType = PK4

  static transferRestrictions = DP_TRANSFER_RESTRICTIONS

  static TRAINER_NAME_OFFSET = 0x64

  static TRAINER_ID_OFFSET = 0x74

  static BOX_SIZE = 0xff0

  static GENERAL_BLOCK_OFFSET = 0x0000

  static GENERAL_BLOCK_SIZE = 0xc100

  static STORAGE_BLOCK_OFFSET = 0xc100

  static STORAGE_BLOCK_SIZE = 0x121e0

  static BOX_NAMES_OFFSET = 0x11ee0

  currentSaveStorageBlockOffset: number = DPSAV.STORAGE_BLOCK_OFFSET

  storageBlockSize: number = DPSAV.STORAGE_BLOCK_SIZE

  boxSize: number = DPSAV.BOX_SIZE

  boxNamesOffset: number

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes)
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(DPSAV.STORAGE_BLOCK_OFFSET, DPSAV.STORAGE_BLOCK_SIZE) <
      this.getCurrentSaveCount(DPSAV.STORAGE_BLOCK_OFFSET + 0x40000, DPSAV.STORAGE_BLOCK_SIZE)
    ) {
      this.currentSaveStorageBlockOffset += 0x40000
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset + 4
    this.boxNamesOffset = this.currentSaveStorageBlockOffset + DPSAV.BOX_NAMES_OFFSET
    this.name = gen4StringToUTF(bytes, DPSAV.TRAINER_NAME_OFFSET, 8)
    this.tid = bytesToUint16LittleEndian(bytes, DPSAV.TRAINER_ID_OFFSET)
    this.sid = bytesToUint16LittleEndian(bytes, DPSAV.TRAINER_ID_OFFSET + 2)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.buildBoxes()
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    return bytesToUint32LittleEndian(this.bytes, blockOffset + blockSize - this.footerSize)
  }
}
