import { PK4 } from 'pokemon-files'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { CRC16_CCITT } from '../../util/Encryption'
import { gen4StringToUTF } from '../../util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { Box, SAV } from './SAV'
import { ParsedPath } from './path'

export class G4SAV extends SAV<PK4> {
  pkmType = PK4

  currentSaveStorageBlockOffset: number = 0

  currentSaveBoxStartOffset: number = 0

  storageBlockSize: number = 0

  boxSize: number = 0xff0

  boxNamesOffset: number = 0

  footerSize: number = 0x14

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes)
    if (bytesToUint32LittleEndian(bytes, 0) === 0xffffffff) {
      this.tooEarlyToOpen = true
      return
    }
    this.origin = bytes[0x80]
    this.boxes = Array(18)
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
            if (
              this.origin === 0 &&
              mon.trainerID === this.tid &&
              mon.secretID === this.sid &&
              mon.trainerName === this.name
            ) {
              this.origin = mon.gameOfOrigin
            }
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
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
    console.info(
      'updating gen 4 checksum at',
      `0x${(this.currentSaveStorageBlockOffset + this.storageBlockSize - 2)
        .toString(16)
        .padStart(4, '0')}`
    )
    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.currentSaveStorageBlockOffset + this.storageBlockSize - 2
    )
  }

  prepareBoxesForSaving() {
    const changedMonPKMs: OHPKM[] = []
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index]
      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PK4s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }
      const writeIndex = this.currentSaveBoxStartOffset + this.boxSize * box + 136 * index
      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? new PK4(changedMon) : changedMon
          if (mon.gameOfOrigin && mon.dexNum) {
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
    this.updateStorageChecksum()

    return changedMonPKMs
  }
}
