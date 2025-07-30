import { PK4 } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
} from 'src/util/byteLogic'
import { CRC16_CCITT } from 'src/util/Encryption'
import { gen4StringToUTF } from 'src/util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { PathData } from './path'
import { Box, BoxCoordinates, SAV } from './SAV'
import { LOOKUP_TYPE } from './util'

export abstract class G4SAV implements SAV<PK4> {
  static BOX_COUNT = 18
  static pkmType = PK4
  static SAVE_SIZE_BYTES = 0x80000
  static lookupType: LOOKUP_TYPE = 'gen345'

  origin: GameOfOrigin = 0
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

  updatedBoxSlots: BoxCoordinates[] = []

  currentSaveStorageBlockOffset: number = 0

  currentSaveBoxStartOffset: number = 0

  storageBlockSize: number = 0

  boxSize: number = 0xff0

  boxNamesOffset: number = 0

  footerSize: number = 0x14

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
    this.boxes = Array(G4SAV.BOX_COUNT)
    if (bytesToUint32LittleEndian(bytes, 0) === 0xffffffff) {
      this.tooEarlyToOpen = true
      return
    }
    this.origin = bytes[0x80]
  }
  pluginIdentifier?: string | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

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

    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.currentSaveStorageBlockOffset + this.storageBlockSize - 2
    )
  }

  prepareBoxesAndGetModified() {
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

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
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

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Diamond:
        return '#90BEED'
      case GameOfOrigin.Pearl:
        return '#DD7CB1'
      case GameOfOrigin.Platinum:
        return '#A0A08D'
      case GameOfOrigin.HeartGold:
        return '#E8B502'
      case GameOfOrigin.SoulSilver:
        return '#AAB9CF'
      default:
        return '#666666'
    }
  }

  static includesOrigin(origin: GameOfOrigin) {
    return (
      (origin >= GameOfOrigin.Diamond && origin <= GameOfOrigin.Platinum) ||
      (origin >= GameOfOrigin.HeartGold && origin <= GameOfOrigin.SoulSilver)
    )
  }

  getPluginIdentifier() {
    return undefined
  }
}
