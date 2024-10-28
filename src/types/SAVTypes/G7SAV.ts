import { PK7 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import {
  SM_TRANSFER_RESTRICTIONS,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../consts/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { CRC16_Invert } from '../../util/Encryption'
import { utf16BytesToString } from '../../util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { SaveType } from '../types'
import { Box, SAV } from './SAV'
import { ParsedPath } from './path'
import { SIZE_USUM } from './util'

const SM_PC_OFFSET = 0x04e00
const SM_METADATA_OFFSET = 0x6be00 - 0x200
const SM_PC_CHECKSUM_OFFSET = SM_METADATA_OFFSET + 0x14 + 14 * 8 + 6
const USUM_PC_OFFSET = 0x05200
const USUM_METADATA_OFFSET = 0x6cc00 - 0x200
const USUM_PC_CHECKSUM_OFFSET = USUM_METADATA_OFFSET + 0x14 + 14 * 8 + 6
const SM_BOX_NAMES_OFFSET: number = 0x04800
const USUM_BOX_NAMES_OFFSET: number = 0x04c00
const BOX_SIZE: number = 232 * 30
const BOX_COUNT = 32

export class G7SAV extends SAV<PK7> {
  trainerDataOffset: number = 0x1200

  boxes: Array<Box<PK7>>

  saveType = SaveType.G7

  boxChecksumOffset: number = 0x75fda

  pcOffset = SM_PC_OFFSET
  pcSize = 0x36600
  pcChecksumOffset = SM_PC_CHECKSUM_OFFSET
  boxNamesOffset = SM_BOX_NAMES_OFFSET

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes)
    if (bytes.length === SIZE_USUM) {
      this.trainerDataOffset = 0x1400
    }
    this.name = utf16BytesToString(this.bytes, this.trainerDataOffset + 0x38, 0x10)
    const fullTrainerID = bytesToUint32LittleEndian(this.bytes, this.trainerDataOffset)
    this.tid = fullTrainerID % 1000000
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2)
    this.currentPCBox = this.bytes[0] < 32 ? this.bytes[0] : 0
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.bytes[this.trainerDataOffset + 4]
    switch (this.origin) {
      case GameOfOrigin.Sun:
      case GameOfOrigin.Moon:
        this.transferRestrictions = SM_TRANSFER_RESTRICTIONS
        break
      case GameOfOrigin.UltraMoon:
      case GameOfOrigin.UltraSun:
        this.transferRestrictions = USUM_TRANSFER_RESTRICTIONS
        this.pcOffset = USUM_PC_OFFSET
        this.pcChecksumOffset = USUM_PC_CHECKSUM_OFFSET
        this.boxNamesOffset = USUM_BOX_NAMES_OFFSET
        break
    }
    this.boxes = Array(BOX_COUNT)
    for (let box = 0; box < BOX_COUNT; box++) {
      const boxName = utf16BytesToString(this.bytes, this.boxNamesOffset + 34 * box, 17)
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

  prepareBoxesForSaving() {
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
    this.bytes.set(uint16ToBytesLittleEndian(this.calculateChecksum()), this.pcChecksumOffset)
    return changedMonPKMs
  }

  calculateChecksum(): number {
    return CRC16_Invert(this.bytes, this.pcOffset, this.pcSize)
  }
}
