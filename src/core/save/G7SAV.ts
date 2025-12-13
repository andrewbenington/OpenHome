import { Gender, OriginGame } from '@pkm-rs/pkg'
import { PK7 } from '@pokemon-files/pkm'
import { CRC16_Invert, SignWithMemeCrypto } from 'src/core/save/encryption/Encryption'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from 'src/core/save/util/byteLogic'
import { utf16BytesToString } from 'src/util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxCoordinates, OfficialSAV } from './SAV'
import { PathData } from './util/path'
import { SIZE_USUM } from './util/util'

const BOX_SIZE: number = 232 * 30
const BOX_COUNT = 32

export abstract class G7SAV extends OfficialSAV<PK7> {
  static pkmType = PK7
  static saveTypeAbbreviation = 'SM/USUM'
  static saveTypeID = 'G7SAV'

  origin: OriginGame

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''
  trainerGender: Gender = Gender.Male

  currentPCBox: number = 0 // TODO: Gen 7 current box

  boxes: Array<Box<PK7>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  trainerDataOffset: number = 0x1200

  boxChecksumOffset: number = 0x75fda

  pcOffset: number
  pcSize = 0x36600
  pcChecksumOffset: number

  constructor(
    path: PathData,
    bytes: Uint8Array,
    pcOffset: number,
    pcChecksumOffset: number,
    boxNamesOffset: number
  ) {
    super()
    this.bytes = bytes
    this.filePath = path
    if (bytes.length === SIZE_USUM) {
      this.trainerDataOffset = 0x1400
    }
    this.name = utf16BytesToString(this.bytes, this.trainerDataOffset + 0x38, 0x10)

    const fullTrainerID = bytesToUint32LittleEndian(this.bytes, this.trainerDataOffset)

    this.tid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset)
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2)
    this.currentPCBox = this.bytes[0] < 32 ? this.bytes[0] : 0
    this.displayID = (fullTrainerID % 1000000).toString().padStart(6, '0')
    this.origin = this.bytes[this.trainerDataOffset + 4]
    this.trainerGender = this.bytes[this.trainerDataOffset + 5]
    this.pcOffset = pcOffset
    this.pcChecksumOffset = pcChecksumOffset

    this.boxes = Array(BOX_COUNT)
    for (let box = 0; box < BOX_COUNT; box++) {
      const boxName = utf16BytesToString(this.bytes, boxNamesOffset + 34 * box, 17)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < BOX_COUNT; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.pcOffset + BOX_SIZE * box + 232 * monIndex
          const endByte = this.pcOffset + BOX_SIZE * box + 232 * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PK7(monData.buffer, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []

    this.updatedBoxSlots.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index]

      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PK6s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }
      const writeIndex = this.pcOffset + BOX_SIZE * box + 232 * index

      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? new PK7(changedMon) : changedMon

          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const mon = new PK7(new Uint8Array(232).buffer)

        mon.checksum = 0x0204
        this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
      }
    })
    this.bytes.set(uint16ToBytesLittleEndian(this.calculatePcChecksum()), this.pcChecksumOffset)
    this.bytes = SignWithMemeCrypto(this.bytes)
    return changedMonPKMs
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  calculatePcChecksum(): number {
    return CRC16_Invert(this.bytes, this.pcOffset, this.pcSize)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  calculateChecksumStr() {
    return `0x${this.calculatePcChecksum().toString(16).padStart(4, '0')}`
  }

  getStoredChecksum(): number {
    const dataView = new DataView(this.bytes.buffer)

    return dataView.getUint16(this.pcChecksumOffset, true)
  }

  getStoredChecksumStr() {
    return `0x${this.getStoredChecksum().toString(16).padStart(4, '0')}`
  }

  getDisplayData() {
    return {
      'Calculated Checksum': this.calculateChecksumStr(),
    }
  }
}
