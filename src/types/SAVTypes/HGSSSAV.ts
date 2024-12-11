import { PK4 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { HGSS_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from 'src/util/byteLogic'
import { gen4StringToUTF } from 'src/util/Strings/StringConverter'
import { isRestricted } from '../TransferRestrictions'
import { G4SAV } from './G4SAV'
import { PathData } from './path'
import { hasDesamumeFooter } from './util'

export class HGSSSAV extends G4SAV {
  static pkmType = PK4

  name: string
  tid: number
  sid: number
  displayID: string

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  static transferRestrictions = HGSS_TRANSFER_RESTRICTIONS

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

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(HGSSSAV.STORAGE_BLOCK_OFFSET, HGSSSAV.STORAGE_BLOCK_SIZE) <
      this.getCurrentSaveCount(HGSSSAV.STORAGE_BLOCK_OFFSET + 0x40000, HGSSSAV.STORAGE_BLOCK_SIZE)
    ) {
      this.currentSaveStorageBlockOffset += 0x40000
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset
    this.boxNamesOffset = this.currentSaveStorageBlockOffset + HGSSSAV.BOX_NAMES_OFFSET
    this.name = gen4StringToUTF(bytes, HGSSSAV.TRAINER_NAME_OFFSET, 8)
    this.tid = bytesToUint16LittleEndian(bytes, HGSSSAV.TRAINER_ID_OFFSET)
    this.sid = bytesToUint16LittleEndian(bytes, HGSSSAV.TRAINER_ID_OFFSET + 2)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.buildBoxes()
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    return bytesToUint32LittleEndian(this.bytes, blockOffset + blockSize - this.footerSize)
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(HGSS_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static saveTypeName = 'Pokémon HeartGold/SoulSilver'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G4SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G4SAV.SAVE_SIZE_BYTES) {
      if (!hasDesamumeFooter(bytes, G4SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    return G4SAV.validDateAndSize(bytes, 0x4f628)
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.HeartGold || origin === GameOfOrigin.SoulSilver
  }
}
