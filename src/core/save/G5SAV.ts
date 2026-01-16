import { CRC16_CCITT } from '@openhome-core/save/encryption/Encryption'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '@openhome-core/save/util/byteLogic'
import { gen5StringToUTF } from '@openhome-core/save/util/Strings/StringConverter'
import { unique } from '@openhome-core/util/functional'
import { Gender, OriginGame } from '@pkm-rs/pkg'
import { PK5 } from '@pokemon-files/pkm'
import { OHPKM } from '../pkm/OHPKM'
import { Box, OfficialSAV, SaveMonLocation } from './interfaces'
import { hasDesamumeFooter, LookupType } from './util'
import { PathData } from './util/path'

const PC_OFFSET = 0x400
const BOX_NAMES_OFFSET: number = 0x04
const BOX_CHECKSUM_OFFSET: number = 0xff2
const BOX_SIZE: number = 0x1000

export abstract class G5SAV extends OfficialSAV<PK5> {
  static BOX_COUNT = 24
  static pkmType = PK5
  static SAVE_SIZE_BYTES = 0x80000
  static lookupType: LookupType = 'gen345'

  static saveTypeAbbreviation = 'BW/BW2'
  static saveTypeID = 'G5SAV'

  origin: OriginGame = OriginGame.Black
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
  boxes: Array<Box<PK5>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: SaveMonLocation[] = []

  trainerDataOffset: number = 0x19400
  static originOffset = 0x1941f

  checksumMirrorsOffset: number = 0x23f00

  checksumMirrorsSize: number = 0x8c

  checksumMirrorsChecksumOffset: number = 0x23f9a

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.boxes = new Array(G5SAV.BOX_COUNT)

    if (bytesToUint32LittleEndian(bytes, 0) === 0xffffffff) {
      this.tooEarlyToOpen = true
      return
    }

    this.name = gen5StringToUTF(this.bytes, this.trainerDataOffset + 0x04, 0x10)
    this.tid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 0x14)
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 0x16)
    this.currentPCBox = this.bytes[0]
    this.displayID = this.tid.toString().padStart(5, '0')
    this.trainerGender = this.bytes[0x21]

    this.origin = this.bytes[this.trainerDataOffset + 0x1f]
    if (this.origin >= OriginGame.White2) {
      this.checksumMirrorsOffset = 0x25f00
      this.checksumMirrorsSize = 0x94
      this.checksumMirrorsChecksumOffset = 0x25fa2
    }
    for (let box = 0; box < 24; box++) {
      const boxName = gen5StringToUTF(this.bytes, BOX_NAMES_OFFSET + 40 * box, 20)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < 24; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = PC_OFFSET + BOX_SIZE * box + 136 * monIndex
          const endByte = PC_OFFSET + BOX_SIZE * box + 136 * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PK5(monData.buffer, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].boxSlots[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  updateBoxChecksum = (boxIndex: number) => {
    // const oldChecksum = bytesToUint16LittleEndian(
    //   this.bytes,
    //   PC_OFFSET + boxIndex * BOX_SIZE + BOX_CHECKSUM_OFFSET
    // );
    const newChecksum = CRC16_CCITT(
      this.bytes,
      PC_OFFSET + boxIndex * BOX_SIZE,
      BOX_CHECKSUM_OFFSET - 2
    )

    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      PC_OFFSET + boxIndex * BOX_SIZE + BOX_CHECKSUM_OFFSET
    )
    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.checksumMirrorsOffset + 2 * (boxIndex + 1)
    )
  }

  updateMirrorsChecksum = () => {
    const newChecksum = CRC16_CCITT(
      this.bytes,
      this.checksumMirrorsOffset,
      this.checksumMirrorsSize
    )

    this.bytes.set(uint16ToBytesLittleEndian(newChecksum), this.checksumMirrorsChecksumOffset)
  }

  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const mon = this.boxes[box].boxSlots[index]

      const writeIndex = PC_OFFSET + BOX_SIZE * box + 136 * index

      // mon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (mon) {
        try {
          if (mon.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        this.bytes.set(new Uint8Array(136), writeIndex)
      }
    })
    unique(this.updatedBoxSlots.map((coords) => coords.box)).forEach((boxIndex) =>
      this.updateBoxChecksum(boxIndex)
    )
    this.updateMirrorsChecksum()
  }

  convertOhpkm(ohpkm: OHPKM): PK5 {
    return new PK5(ohpkm)
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  static gen4ValidDateAndSize(bytes: Uint8Array, offset: number) {
    const size = bytesToUint32LittleEndian(bytes, offset - 0xc)

    if (size !== (offset & 0xffff)) return false
    const date = bytesToUint32LittleEndian(bytes, offset - 0x8)

    const DATE_INT = 0x20060623
    const DATE_KO = 0x20070903

    return date === DATE_INT || date === DATE_KO
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < G5SAV.SAVE_SIZE_BYTES) {
      return false
    }
    if (bytes.length > G5SAV.SAVE_SIZE_BYTES) {
      if (!hasDesamumeFooter(bytes, G5SAV.SAVE_SIZE_BYTES)) {
        return false
      }
    }

    const g5Origin = bytes[G5SAV.originOffset]

    return g5Origin >= OriginGame.White && g5Origin <= OriginGame.Black2
  }
}
