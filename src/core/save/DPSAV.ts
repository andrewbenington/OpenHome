import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '@openhome/core/save/util/byteLogic'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { PK4 } from '@pokemon-files/pkm'
import { Item } from '@pokemon-resources/consts/Items'
import { DP_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { gen4StringToUTF } from 'src/core/save/util/Strings/StringConverter'
import { isRestricted } from 'src/core/save/util/TransferRestrictions'
import { G4SAV } from './G4SAV'
import { PathData } from './util/path'
import { hasDesamumeFooter } from './util/util'

export class DPSAV extends G4SAV {
  static pkmType = PK4

  name: string
  tid: number
  sid: number
  displayID: string
  trainerGender: Gender

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

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

  constructor(path: PathData, bytes: Uint8Array) {
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
    this.trainerGender = bytes[DPSAV.TRAINER_ID_OFFSET + 8]
    this.buildBoxes()
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    return bytesToUint32LittleEndian(this.bytes, blockOffset + blockSize - this.footerSize)
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(DP_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.SecretPotion
  }

  static saveTypeName = 'Pokémon Diamond/Pearl'
  static saveTypeID = 'DPSAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G4SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G4SAV.SAVE_SIZE_BYTES) {
      if (!hasDesamumeFooter(bytes, G4SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    return G4SAV.validDateAndSize(bytes, 0x4c100)
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Diamond || origin === OriginGame.Pearl
  }
}
