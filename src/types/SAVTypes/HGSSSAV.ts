import { HGSS_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { SaveType } from '../../types/types'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../../util/ByteLogic'
import { gen4StringToUTF } from '../../util/Strings/StringConverter'
import { G4SAV } from './G4SAV'

export class HGSSSAV extends G4SAV {
  saveType = SaveType.HGSS

  transferRestrictions = HGSS_TRANSFER_RESTRICTIONS

  static TRAINER_NAME_OFFSET = 0x64

  static TRAINER_ID_OFFSET = 0x74

  static BOX_SIZE = 0xff0 + 0x10

  static GENERAL_BLOCK_OFFSET = 0x0000

  static GENERAL_BLOCK_SIZE = 0xf628

  static STORAGE_BLOCK_OFFSET = 0xf700

  static STORAGE_BLOCK_SIZE = 0x12310

  static BOX_NAMES_OFFSET = 0x12008

  static BLOCK_FOOTER_SIZE = 0x10

  currentSaveStorageBlockOffset: number = HGSSSAV.STORAGE_BLOCK_OFFSET

  storageBlockSize: number = HGSSSAV.STORAGE_BLOCK_SIZE

  boxSize: number = HGSSSAV.BOX_SIZE

  footerSize: number = HGSSSAV.BLOCK_FOOTER_SIZE

  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes)
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(
        HGSSSAV.STORAGE_BLOCK_OFFSET,
        HGSSSAV.STORAGE_BLOCK_SIZE
      ) <
      this.getCurrentSaveCount(
        HGSSSAV.STORAGE_BLOCK_OFFSET + 0x40000,
        HGSSSAV.STORAGE_BLOCK_SIZE
      )
    ) {
      this.currentSaveStorageBlockOffset += 0x40000
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset
    this.boxNamesOffset =
      this.currentSaveStorageBlockOffset + HGSSSAV.BOX_NAMES_OFFSET
    this.name = gen4StringToUTF(bytes, HGSSSAV.TRAINER_NAME_OFFSET, 8)
    this.tid = bytesToUint16LittleEndian(bytes, HGSSSAV.TRAINER_ID_OFFSET)
    this.sid = bytesToUint16LittleEndian(bytes, HGSSSAV.TRAINER_ID_OFFSET + 2)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.buildBoxes()
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    return bytesToUint32LittleEndian(
      this.bytes,
      blockOffset + blockSize - this.footerSize
    )
  }
}
