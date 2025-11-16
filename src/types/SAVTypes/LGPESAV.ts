import { OriginGame } from '@pkm-rs/pkg'
import { PB7 } from '@pokemon-files/pkm'
import { utf16BytesToString } from '@pokemon-files/util'
import { ceil, min } from 'lodash'
import { NationalDex } from 'src/consts/NationalDex'
import { LGE_STARTER, LGP_STARTER } from '../../consts/Formes'
import { Item } from '../../consts/Items'
import { LGPE_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from '../../util/byteLogic'
import { CRC16_NoInvert } from '../../util/Encryption'
import { OHPKM } from '../pkm/OHPKM'
import { isRestricted } from '../TransferRestrictions'
import { PathData } from './path'
import { Box, BoxCoordinates, OfficialSAV, SlotMetadata } from './SAV'

const PC_OFFSET = 0x5c00
const PC_CHECKSUM_OFFSET = 0xb8662
const PC_SIZE = 0x3f7a0
const BOX_SLOTS_TOTAL = 1000
const BOX_COUNT = ceil(BOX_SLOTS_TOTAL / 30)

const SAVE_SIZE_BYTES = 0x100000
const MON_BYTE_SIZE = 260

const POKE_LIST_HEADER_OFFSET = 0x5a00
const POKE_LIST_HEADER_SIZE = 0x12
const POKE_LIST_HEADER_CHECKSUM_OFFSET = 0xb865a

const EMPTY_SLOT_CHECKSUM = 0x0000

export class LGPESAV extends OfficialSAV<PB7> {
  static pkmType = PB7
  static saveTypeAbbreviation = 'LGPE'
  static saveTypeName: string = "Pokémon Let's Go Pikachu/Eevee"
  static saveTypeID = 'LGPESAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.LetsGoPikachu || origin === OriginGame.LetsGoEevee
  }

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

  currentPCBox: number = 0 // TODO: Gen 7 current box

  boxes: Array<Box<PB7>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  trainerDataOffset: number = 0x1000

  pokeListHeader: PokeListHeader

  constructor(path: PathData, bytes: Uint8Array) {
    super()
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

    for (let monIndex = 0; monIndex < BOX_SLOTS_TOTAL; monIndex++) {
      try {
        const mon = this.getMonAtIndex(monIndex)
        // LGPE doesn't have real "boxes", but for display purposes we pretend there are
        // 1000 / 30 boxes, rounded up
        const displayBoxNum = Math.floor(monIndex / 30)
        const displayBoxSlot = monIndex % 30

        if (mon !== null) {
          this.boxes[displayBoxNum].pokemon[displayBoxSlot] = mon
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []

    this.updatedBoxSlots.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index]

      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PB7s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }
      const monIndex = 30 * box + index

      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? new PB7(changedMon) : changedMon

          if (mon?.gameOfOrigin && mon?.dexNum) {
            this.writeMonAtIndex(mon, monIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        this.writeMonAtIndex(null, monIndex)
      }
    })
    const monCount = this.compressStorage()

    this.pokeListHeader.boxCount = monCount
    this.pokeListHeader.writeToBytes(this.bytes.buffer as ArrayBuffer)

    const dataView = new DataView(this.bytes.buffer)
    const newPcChecksum = this.calculatePcChecksum()
    const newPokeHeaderChecksum = this.calculatePokeHeaderChecksum()

    dataView.setUint16(PC_CHECKSUM_OFFSET, newPcChecksum, true)
    dataView.setUint16(POKE_LIST_HEADER_CHECKSUM_OFFSET, newPokeHeaderChecksum, true)
    return changedMonPKMs
  }

  compressStorage() {
    const storageBufferCopy = new Uint8Array(MON_BYTE_SIZE * BOX_SLOTS_TOTAL)
    let nextEmptyIndex = 0

    for (let monIndex = 0; monIndex < BOX_SLOTS_TOTAL; monIndex++) {
      const startByte = PC_OFFSET + MON_BYTE_SIZE * monIndex
      const endByte = PC_OFFSET + MON_BYTE_SIZE * (monIndex + 1)
      const monBytes = this.bytes.slice(startByte, endByte)
      const slotMon = this.getMonAtIndex(monIndex)

      if (slotMon === null) {
        continue
      }

      const writeIndex = MON_BYTE_SIZE * nextEmptyIndex

      storageBufferCopy.set(monBytes, writeIndex)
      nextEmptyIndex++
    }

    for (let monIndex = nextEmptyIndex; monIndex < BOX_SLOTS_TOTAL; monIndex++) {
      LGPESAV.writeMonToStorageBytesAtIndex(storageBufferCopy, null, monIndex)
    }

    this.bytes.set(storageBufferCopy, PC_OFFSET)

    return nextEmptyIndex
  }

  getMonAtIndex(monIndex: number) {
    const startByte = PC_OFFSET + MON_BYTE_SIZE * monIndex
    const endByte = PC_OFFSET + MON_BYTE_SIZE * (monIndex + 1)
    const monBytes = this.bytes.slice(startByte, endByte)
    const mon = new PB7(monBytes.buffer, true)

    if (mon.checksum === EMPTY_SLOT_CHECKSUM && mon.encryptionConstant === 0) {
      return null
    }

    return mon
  }

  writeMonAtIndex(mon: PB7 | null, monIndex: number) {
    if (mon === null) {
      // empty slot representation
      mon = new PB7(new Uint8Array(MON_BYTE_SIZE).buffer)
    }

    mon.refreshChecksum()
    const monBytes = new Uint8Array(mon.toPCBytes())
    const writeIndex = PC_OFFSET + MON_BYTE_SIZE * monIndex

    this.bytes.set(monBytes, writeIndex)
  }

  static writeMonToStorageBytesAtIndex(bytes: Uint8Array, mon: PB7 | null, monIndex: number) {
    if (mon === null) {
      // empty slot representation
      mon = new PB7(new Uint8Array(MON_BYTE_SIZE).buffer)
    }

    mon.refreshChecksum()
    const monBytes = new Uint8Array(mon.toPCBytes())
    const writeIndex = MON_BYTE_SIZE * monIndex

    bytes.set(monBytes, writeIndex)
  }

  getFirstEmptySlot(): number | null {
    for (let monIndex = 0; monIndex < BOX_SLOTS_TOTAL; monIndex++) {
      if (this.getMonAtIndex(monIndex) === null) {
        return monIndex
      }
    }

    return null
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(LGPE_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.MagmarCandy
  }

  getSlotMetadata = (boxNum: number, boxSlot: number): SlotMetadata => {
    const monIndex = boxNum * 30 + boxSlot

    if (monIndex >= BOX_SLOTS_TOTAL) {
      return {
        isDisabled: true,
        disabledReason: 'Pokémon Box ends at slot 1000',
      }
    }

    const mon = this.boxes[boxNum].pokemon[boxSlot]

    if (
      (mon?.dexNum === NationalDex.Pikachu && mon.formeNum === LGP_STARTER) ||
      (mon?.dexNum === NationalDex.Eevee && mon.formeNum === LGE_STARTER)
    ) {
      return {
        isDisabled: true,
        disabledReason: 'Partner Pokémon cannot be moved out of the box',
      }
    }

    if (this.pokeListHeader.partyIndices.includes(monIndex)) {
      return {
        isDisabled: true,
        disabledReason: 'This Pokémon is in your party and cannot be moved out of the box',
      }
    }

    return { isDisabled: false }
  }

  calculatePcChecksum(): number {
    return CRC16_NoInvert(this.bytes, PC_OFFSET, PC_SIZE)
  }

  getStoredPcChecksum(): number {
    const dataView = new DataView(this.bytes.buffer)

    return dataView.getUint16(PC_CHECKSUM_OFFSET, true)
  }

  calculatePokeHeaderChecksum(): number {
    return CRC16_NoInvert(this.bytes, POKE_LIST_HEADER_OFFSET, POKE_LIST_HEADER_SIZE)
  }

  getStoredPokeHeaderChecksum(): number {
    const dataView = new DataView(this.bytes.buffer)

    return dataView.getUint16(POKE_LIST_HEADER_CHECKSUM_OFFSET, true)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getDisplayData() {
    return {
      'Stored PC Checksum': displayChecksum(this.getStoredPcChecksum()),
      'Calculated Poke List Checksum': displayChecksum(this.calculatePokeHeaderChecksum()),
      'Stored Poke List Checksum': displayChecksum(this.getStoredPokeHeaderChecksum()),
      'Starter Index': this.pokeListHeader.starterIndex,
      'Party Indices': this.pokeListHeader.partyIndices.join(', '),
      'Box Count': this.pokeListHeader.boxCount,
    }
  }
}

function displayChecksum(value: number): string {
  return `0x${value.toString(16).padStart(4, '0')}`
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
  }

  writeToBytes(buffer: ArrayBuffer) {
    const dataView = new DataView(buffer)

    dataView.setUint16(POKE_LIST_HEADER_OFFSET, this.starterIndex, true)
    for (let i = 0; i < 6; i++) {
      dataView.setUint16(POKE_LIST_HEADER_OFFSET + 2 + i * 2, this.partyIndices[i], true)
    }
    dataView.setUint16(POKE_LIST_HEADER_OFFSET + 14, this.boxCount, true)
  }
}
