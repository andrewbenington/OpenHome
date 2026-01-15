import { CRC16_Invert, SignWithMemeCrypto } from '@openhome-core/save/encryption/Encryption'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '@openhome-core/save/util/byteLogic'
import { utf16BytesToString } from '@openhome-core/save/util/Strings/StringConverter'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { PK7 } from '@pokemon-files/pkm'
import { OhpkmTracker } from '../../tracker'
import { OHPKM } from '../pkm/OHPKM'
import { Box, OfficialSAV, SaveMonLocation } from './interfaces'
import { SIZE_USUM } from './util'
import { PathData } from './util/path'

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

  updatedBoxSlots: SaveMonLocation[] = []

  trainerDataOffset: number = 0x1200

  boxChecksumOffset: number = 0x75fda

  pcSize = 0x36600
  abstract pcChecksumOffset: number

  constructor(path: PathData, bytes: Uint8Array, tracker: OhpkmTracker) {
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

    this.boxes = Array(BOX_COUNT)
    for (let box = 0; box < BOX_COUNT; box++) {
      const boxName = utf16BytesToString(this.bytes, this.getBoxNamesOffset() + 34 * box, 17)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < BOX_COUNT; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.getPcOffset() + BOX_SIZE * box + 232 * monIndex
          const endByte = this.getPcOffset() + BOX_SIZE * box + 232 * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PK7(monData.buffer, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].boxSlots[monIndex] = tracker.wrapWithIdentifier(mon, undefined)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  abstract getBoxNamesOffset(): number

  abstract getPcOffset(): number

  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const writeIndex = this.getPcOffset() + BOX_SIZE * box + 232 * index
      const updatedSlotContent = this.boxes[box].boxSlots[index]
      if (!updatedSlotContent) {
        // mon was moved from this now-empty slot
        this.bytes.set(emptyBoxSlotBytes(), writeIndex)
        return
      }

      const mon = updatedSlotContent.data
      try {
        if (mon.gameOfOrigin && mon.dexNum) {
          mon.refreshChecksum()
          this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
        }
      } catch (e) {
        console.error(e)
      }
    })
    this.bytes.set(uint16ToBytesLittleEndian(this.calculatePcChecksum()), this.pcChecksumOffset)
    this.bytes = SignWithMemeCrypto(this.bytes)
  }

  convertOhpkm(ohpkm: OHPKM): PK7 {
    return new PK7(ohpkm)
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  calculatePcChecksum(): number {
    return CRC16_Invert(this.bytes, this.getPcOffset(), this.pcSize)
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

function emptyBoxSlotBytes() {
  const mon = new PK7(new Uint8Array(232).buffer)
  mon.checksum = 0x0204
  return new Uint8Array(mon.toPCBytes())
}
