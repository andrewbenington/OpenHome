import { CRC16_CCITT } from '@openhome-core/save/encryption/Encryption'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '@openhome-core/save/util/byteLogic'
import { gen4StringToUTF } from '@openhome-core/save/util/Strings/StringConverter'
import { OriginGame } from '@pkm-rs/pkg'
import { PK4 } from '@pokemon-files/pkm'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxAndSlot, OfficialSAV } from './interfaces'
import { LookupType } from './util'
import { PathData } from './util/path'

export abstract class G4SAV extends OfficialSAV<PK4> {
  static BOX_COUNT = 18
  static pkmType = PK4
  static SAVE_SIZE_BYTES = 0x80000
  static lookupType: LookupType = 'gen345'

  origin: OriginGame
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 4 money
  abstract name: string
  abstract tid: number
  abstract sid: number
  abstract displayID: string

  currentPCBox: number = 0 // TODO: Gen 4 current box

  boxes: Array<Box<PK4>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxAndSlot[] = []

  currentSaveStorageBlockOffset: number = 0

  currentSaveBoxStartOffset: number = 0

  storageBlockSize: number = 0

  boxSize: number = 0xff0

  boxNamesOffset: number = 0

  footerSize: number = 0x14

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.boxes = Array(G4SAV.BOX_COUNT)
    if (bytesToUint32LittleEndian(bytes, 0) === 0xffffffff) {
      this.tooEarlyToOpen = true
      this.origin = OriginGame.Diamond
      return
    }
    this.origin = bytes[0x80]
  }

  buildBoxes() {
    if (bytesToUint32LittleEndian(this.bytes, this.currentSaveBoxStartOffset) === 0xffffffff) {
      this.tooEarlyToOpen = true
      return
    }

    for (let box = 0; box < 18; box++) {
      const boxLabel = gen4StringToUTF(this.bytes, this.boxNamesOffset + 40 * box, 20)

      this.boxes[box] = new Box(boxLabel, 30)
    }

    for (let box = 0; box < 18; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.currentSaveBoxStartOffset + this.boxSize * box + 136 * monIndex
          const endByte = this.currentSaveBoxStartOffset + this.boxSize * box + 136 * (monIndex + 1)
          const monData = this.bytes.slice(startByte, endByte)
          const mon = new PK4(monData.buffer, true)

          if (mon.dexNum !== 0 && mon.gameOfOrigin !== 0) {
            // set game origin if origin missing and matching mon is found; necessary for diamond/pearl
            if (
              this.origin === 0 &&
              mon.trainerID === this.tid &&
              mon.secretID === this.sid &&
              mon.trainerName === this.name
            ) {
              this.origin = mon.gameOfOrigin
            }
            this.boxes[box].boxSlots[monIndex] = mon
          }
        } catch (e) {
          console.error(`G4SAV: ${e}`)
        }
      }
    }
  }

  getStorageChecksum() {
    return bytesToUint16LittleEndian(
      this.bytes,
      this.currentSaveStorageBlockOffset + this.storageBlockSize - 2
    )
  }

  updateStorageChecksum = () => {
    const newChecksum = CRC16_CCITT(
      this.bytes,
      this.currentSaveStorageBlockOffset,
      this.storageBlockSize - this.footerSize
    )

    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.currentSaveStorageBlockOffset + this.storageBlockSize - 2
    )
  }

  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, boxSlot: index }) => {
      const mon = this.boxes[box].boxSlots[index]

      const writeIndex = this.currentSaveBoxStartOffset + this.boxSize * box + 136 * index

      // mon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (mon) {
        try {
          if (mon.gameOfOrigin && mon.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(`G4SAV.prepareForSaving: ${e}`)
        }
      } else {
        this.bytes.set(EMPTY_SLOT_BYTES, writeIndex)
      }
    })
    this.updateStorageChecksum()
  }

  convertOhpkm(ohpkm: OHPKM): PK4 {
    return new PK4(ohpkm)
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  static saveTypeAbbreviation = 'DPPt/HGSS'
  static saveTypeName = 'Pokémon Diamond/Pearl/Platinum/HeartGold/SoulSilver'
  static saveTypeID = 'G4SAV'

  // Gen 4 saves include a size and hex "date" that can identify save type
  static validDateAndSize(bytes: Uint8Array, offset: number) {
    const size = bytesToUint32LittleEndian(bytes, offset - 0xc)

    if (size !== (offset & 0xffff)) return false
    const date = bytesToUint32LittleEndian(bytes, offset - 0x8)

    const DATE_INT = 0x20060623
    const DATE_KO = 0x20070903

    return date === DATE_INT || date === DATE_KO
  }

  static includesOrigin(origin: OriginGame) {
    return (
      (origin >= OriginGame.Diamond && origin <= OriginGame.Platinum) ||
      (origin >= OriginGame.HeartGold && origin <= OriginGame.SoulSilver)
    )
  }
}

const EMPTY_SLOT_BYTES = new Uint8Array([
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x88, 0x1, 0x88, 0x1,
  0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1,
  0x88, 0x1, 0xff, 0xff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1,
  0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0x88, 0x1, 0xff, 0xff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
  0x0, 0x0, 0x0, 0x0, 0x0, 0x0,
])
