import { CRC16_CCITT } from '@openhome-core/save/encryption/Encryption'
import {
  bytesToUint16LittleEndian,
  uint16ToBytesLittleEndian,
} from '@openhome-core/save/util/byteLogic'
import { utf16BytesToString } from '@openhome-core/save/util/Strings/StringConverter'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { PK6 } from '@pokemon-files/pkm'
import { OhpkmTracker } from '../../tracker'
import { Box, OfficialSAV, SaveMonLocation } from './interfaces'
import { PathData } from './util/path'

const BOX_NAMES_OFFSET: number = 0x04400
const BOX_SIZE: number = 232 * 30
const BOX_DATA_SIZE: number = 0x34ad0

export abstract class G6SAV extends OfficialSAV<PK6> {
  static pkmType = PK6
  static saveTypeAbbreviation = 'XY/ORAS'
  static saveTypeID = 'G6SAV'

  origin: OriginGame
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 5 money
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''
  trainerGender: Gender = Gender.Male

  currentPCBox: number = 0 // TODO: Gen 5 current box

  boxes: Array<Box<PK6>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: SaveMonLocation[] = []

  trainerDataOffset: number = 0x14000

  boxChecksumOffset: number = 0x75fda

  abstract getPcOffset(): number
  pcDataSize = BOX_DATA_SIZE

  abstract pcChecksumOffset: number

  constructor(path: PathData, bytes: Uint8Array, tracker: OhpkmTracker) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.name = utf16BytesToString(this.bytes, this.trainerDataOffset + 72, 0x10)
    this.tid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset)
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2)
    this.currentPCBox = this.bytes[0]
    this.displayID = this.tid.toString().padStart(5, '0')
    this.origin = this.bytes[this.trainerDataOffset + 4]
    this.trainerGender = this.bytes[this.trainerDataOffset + 5]

    this.boxes = Array(31)
    for (let box = 0; box < 31; box++) {
      const boxName = utf16BytesToString(this.bytes, BOX_NAMES_OFFSET + 34 * box, 17)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < 31; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.getPcOffset() + BOX_SIZE * box + 232 * monIndex
          const endByte = this.getPcOffset() + BOX_SIZE * box + 232 * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PK6(monData.buffer, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = tracker.wrapWithIdentifier(mon)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const updatedSlotContent = this.boxes[box].pokemon[index]
      const writeIndex = this.getPcOffset() + BOX_SIZE * box + 232 * index

      // updatedSlotContent will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (updatedSlotContent) {
        try {
          const mon = updatedSlotContent.data

          if (mon.gameOfOrigin && mon.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const mon = new PK6(new Uint8Array(232).buffer)

        this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
      }
    })
    this.bytes.set(uint16ToBytesLittleEndian(this.calculatePcChecksum()), this.pcChecksumOffset)
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  calculatePcChecksum(): number {
    return CRC16_CCITT(this.bytes, this.getPcOffset(), this.pcDataSize)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }
}
