import { PK6 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { bytesToUint16LittleEndian, uint16ToBytesLittleEndian } from '../../util/ByteLogic'
import { CRC16_CCITT } from '../../util/Encryption'
import { utf16BytesToString } from '../../util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxCoordinates, SAV } from './SAV'
import { ParsedPath } from './path'

const BOX_NAMES_OFFSET: number = 0x04400
const BOX_SIZE: number = 232 * 30
const BOX_DATA_SIZE: number = 0x34ad0

export abstract class G6SAV implements SAV<PK6> {
  static pkmType = PK6

  origin: GameOfOrigin = 0
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: ParsedPath
  fileCreated?: Date

  money: number = 0 // TODO: Gen 5 money
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 5 current box

  boxes: Array<Box<PK6>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  trainerDataOffset: number = 0x14000

  boxChecksumOffset: number = 0x75fda

  pcOffset: number
  pcDataSize = BOX_DATA_SIZE
  pcChecksumOffset: number

  constructor(path: ParsedPath, bytes: Uint8Array, pcOffset: number, pcChecksumOffset: number) {
    this.bytes = bytes
    this.filePath = path
    this.name = utf16BytesToString(this.bytes, this.trainerDataOffset + 72, 0x10)
    this.tid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset)
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2)
    this.currentPCBox = this.bytes[0]
    this.displayID = this.tid.toString().padStart(5, '0')
    this.origin = this.bytes[this.trainerDataOffset + 4]
    this.pcOffset = pcOffset
    this.pcChecksumOffset = pcChecksumOffset

    this.boxes = Array(31)
    for (let box = 0; box < 31; box++) {
      const boxName = utf16BytesToString(this.bytes, BOX_NAMES_OFFSET + 34 * box, 17)
      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < 31; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.pcOffset + BOX_SIZE * box + 232 * monIndex
          const endByte = this.pcOffset + BOX_SIZE * box + 232 * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PK6(monData.buffer, true)
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
          const mon = changedMon instanceof OHPKM ? new PK6(changedMon) : changedMon
          if (mon?.gameOfOrigin && mon?.dexNum) {
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
    this.bytes.set(
      uint16ToBytesLittleEndian(CRC16_CCITT(this.bytes, this.pcOffset, 0x34ad0)),
      this.pcChecksumOffset
    )
    return changedMonPKMs
  }

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  calculateChecksum(): number {
    return CRC16_CCITT(this.bytes, this.pcOffset, this.pcDataSize)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.X:
        return '#025DA6'
      case GameOfOrigin.Y:
        return '#EA1A3E'
      case GameOfOrigin.OmegaRuby:
        return '#AB2813'
      case GameOfOrigin.AlphaSapphire:
        return '#26649C'
      default:
        return '#666666'
    }
  }
}
