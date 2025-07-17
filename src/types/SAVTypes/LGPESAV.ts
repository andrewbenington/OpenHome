import { ceil, min } from 'lodash'
import { PB7, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { LGPE_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '../../util/byteLogic'
import { CRC16_NoInvert, SignWithMemeCrypto } from '../../util/Encryption'
import { OHPKM } from '../pkm/OHPKM'
import { isRestricted } from '../TransferRestrictions'
import { PathData } from './path'
import { Box, BoxCoordinates, SAV } from './SAV'

const PC_OFFSET = 0x5c00
const METADATA_OFFSET = 0x6cc00 - 0x200
const PC_CHECKSUM_OFFSET = 0
const BOX_NAMES_OFFSET: number = 0x04c00
const SAVE_SIZE_BYTES = 0x100000
const BOX_SIZE: number = 260 * 30
const MON_BYTE_SIZE = 260
const BOX_SLOTS_TOTAL = 1000
const BOX_COUNT = ceil(BOX_SLOTS_TOTAL / 30)
const POKE_LIST_HEADER_OFFSET = 0x5a00

export class LGPESAV implements SAV<PB7> {
  static pkmType = PB7
  static saveTypeAbbreviation = 'LGPE'
  static saveTypeName: string = "Pokémon Let's Go Pikachu/Eevee"
  static saveTypeID = 'LGPESAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.LetsGoPikachu || origin === GameOfOrigin.LetsGoEevee
  }

  origin: GameOfOrigin = 0
  isPlugin = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 7 current box

  boxes: Array<Box<PB7>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  trainerDataOffset: number = 0x1000

  boxChecksumOffset: number = 0x75fda

  pcOffset = PC_OFFSET
  pcSize = 0x36600
  pcChecksumOffset = 0

  pokeListHeader: PokeListHeader

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
    this.name = utf16BytesToString(
      this.bytes.buffer as ArrayBuffer,
      this.trainerDataOffset + 0x38,
      0x10
    )

    const fullTrainerID = bytesToUint32LittleEndian(this.bytes, this.trainerDataOffset)

    this.tid = fullTrainerID % 1000000
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2)
    this.currentPCBox = 0
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.bytes[this.trainerDataOffset + 4]

    this.pokeListHeader = new PokeListHeader(bytes.buffer as ArrayBuffer)

    this.boxes = Array(BOX_COUNT)
    for (let box = 0; box < BOX_COUNT; box++) {
      const boxName = `Box Slots ${box * 30} - ${min([(box + 1) * 30 - 1, BOX_SLOTS_TOTAL])}`

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < BOX_COUNT; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.pcOffset + BOX_SIZE * box + MON_BYTE_SIZE * monIndex
          const endByte = this.pcOffset + BOX_SIZE * box + MON_BYTE_SIZE * (monIndex + 1)
          const monData = bytes.slice(startByte, endByte)
          const mon = new PB7(monData.buffer, true)

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
      const writeIndex = this.pcOffset + BOX_SIZE * box + MON_BYTE_SIZE * index

      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? new PB7(changedMon) : changedMon

          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const mon = new PB7(new Uint8Array(MON_BYTE_SIZE).buffer)

        mon.checksum = 0x0204
        this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
      }
    })
    this.bytes.set(uint16ToBytesLittleEndian(this.calculateChecksum()), this.pcChecksumOffset)
    this.bytes = SignWithMemeCrypto(this.bytes)
    return changedMonPKMs
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(LGPE_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  calculateChecksum(): number {
    return CRC16_NoInvert(this.bytes, this.pcOffset, this.pcSize)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.LetsGoPikachu:
        return '#F5DA26'
      case GameOfOrigin.LetsGoEevee:
        return '#D4924B'
      default:
        return '#666666'
    }
  }

  getPluginIdentifier() {
    return undefined
  }

  calculateChecksumStr() {
    return `0x${this.calculateChecksum().toString(16).padStart(4, '0')}`
  }

  getDisplayData() {
    console.log(this)
    return {
      'Calculated Checksum': this.calculateChecksumStr(),
      'Starter Index': this.pokeListHeader.starterIndex,
      'Party Indices': this.pokeListHeader.partyIndices.join(', '),
      'Box Count': this.pokeListHeader.boxCount,
    }
  }
}

export class PokeListHeader {
  starterIndex: number
  partyIndices: number[]
  boxCount: number
  constructor(buffer: ArrayBuffer) {
    const dataView = new DataView(buffer)

    this.starterIndex = dataView.getUint16(POKE_LIST_HEADER_OFFSET, true)
    this.partyIndices = []
    for (let i = 0; i < 6; i++) {
      this.partyIndices.push(dataView.getUint16(POKE_LIST_HEADER_OFFSET + 2 + i * 2, true))
    }

    this.boxCount = dataView.getUint16(POKE_LIST_HEADER_OFFSET + 14, true)
    console.log(this)
  }
}
