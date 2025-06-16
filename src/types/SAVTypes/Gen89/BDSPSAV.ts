import { PB8, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { BDSP_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { OHPKM } from '../../pkm/OHPKM'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { Box, BoxCoordinates, SAV } from '../SAV'

const SAVE_SIZE_BYTES = 973856
const BOX_COUNT = 40
const BOX_NAME_LENGTH = 0x22
const BOX_MONS_OFFSET = 0x14ef4

export class BDSPSAV implements SAV<PB8> {
  static boxSizeBytes = PB8.getBoxSize() * 30
  static pkmType = PB8
  static saveTypeAbbreviation = 'BDSP'
  static saveTypeName = 'Pokémon Brilliant Diamond/Shining Pearl'
  static saveTypeID = 'BDSPSAV'

  filePath: PathData
  fileCreated?: Date

  origin: GameOfOrigin = 0
  isPlugin = false

  boxRows = 5
  boxColumns = 6

  money: number = 0
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: current box

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  myStatusBlock: MyStatusBlock
  boxes: Box<PB8>[] = []

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path

    this.myStatusBlock = new MyStatusBlock(bytes)

    this.name = this.myStatusBlock.getName()
    const fullTrainerID = this.myStatusBlock.getFullID()

    this.tid = fullTrainerID % 1000000
    this.sid = this.myStatusBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.myStatusBlock.getGame()

    const boxNamesBlock = new BoxLayoutBDSP(this.bytes)

    this.boxes = Array(this.getBoxCount())
    for (let box = 0; box < this.getBoxCount(); box++) {
      const boxName = boxNamesBlock.getBoxName(box) || `Box ${box + 1}`

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < this.getBoxCount(); box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte =
            BOX_MONS_OFFSET + this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * monIndex
          const endByte = startByte + this.getMonBoxSizeBytes()
          const monData = (bytes.buffer as ArrayBuffer).slice(startByte, endByte)
          const mon = this.buildPKM(monData, true)

          if (box === 0) {
            console.log(
              `monIndex: ${monIndex}, startByte: ${startByte}, endByte: ${endByte}, name: ${mon.nickname}, exp: ${mon.exp}`
            )
          }

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.BrilliantDiamond:
        return '#44BAE5'
      case GameOfOrigin.ShiningPearl:
        return '#DA7D99'
      default:
        return '#666666'
    }
  }

  getPluginIdentifier() {
    return undefined
  }

  getBoxCount = () => BOX_COUNT

  buildPKM(bytes: ArrayBuffer, encrypted: boolean): PB8 {
    return new PB8(bytes, encrypted)
  }

  getMonBoxSizeBytes(): number {
    return PB8.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return BDSPSAV.boxSizeBytes
  }

  // TODO: implement
  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []

    // this.updatedBoxSlots.forEach(({ box, index }) => {
    //   const changedMon = this.boxes[box].pokemon[index]

    //   // we don't want to save OHPKM files of mons that didn't leave the save
    //   // (and would still be PK6s)
    //   if (changedMon instanceof OHPKM) {
    //     changedMonPKMs.push(changedMon)
    //   }
    //   const writeIndex = this.pcOffset + BDSPSAV.boxSizeBytes * box + PK8.getBoxSize() * index

    //   // changedMon will be undefined if pokemon was moved from this slot
    //   // and the slot was left empty
    //   if (changedMon) {
    //     try {
    //       const mon = changedMon instanceof OHPKM ? new PK7(changedMon) : changedMon

    //       if (mon?.gameOfOrigin && mon?.dexNum) {
    //         mon.refreshChecksum()
    //         this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
    //       }
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   } else {
    //     const mon = new PK8(new Uint8Array(PK8.getBoxSize()).buffer)

    //     mon.checksum = 0x0204
    //     this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
    //   }
    // })
    // this.bytes.set(uint16ToBytesLittleEndian(this.calculateChecksum()), this.pcChecksumOffset)
    // this.bytes = SignWithMemeCrypto(this.bytes)
    return changedMonPKMs
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(BDSP_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  // TODO: make file size flexible
  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length !== SAVE_SIZE_BYTES) {
      return false
    }
    return true
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.BrilliantDiamond || origin === GameOfOrigin.ShiningPearl
  }
}

class BoxLayoutBDSP {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x148aa, 0x148aa + 0x64a).buffer)
  }

  public getBoxName(index: number): string {
    if (index >= BOX_COUNT) {
      throw Error('Attempting to get box name at index past BOX_COUNT')
    }
    return utf16BytesToString(this.dataView.buffer, index * BOX_NAME_LENGTH, BOX_NAME_LENGTH)
  }

  public getCurrentBox(): number {
    return this.dataView.getUint8(0x61e)
  }
}

class MyStatusBlock {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x79bb4, 0x79bb4 + 0x50).buffer)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0, 24)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x1c, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x1e, true)
  }
  public getGender(): boolean {
    return !(this.dataView.getUint8(0x24) & 1)
  }
  public getGame(): GameOfOrigin {
    const origin = this.dataView.getUint8(0x2b)
    return origin === 0
      ? GameOfOrigin.BrilliantDiamond
      : origin === 1
        ? GameOfOrigin.ShiningPearl
        : GameOfOrigin.INVALID_0
  }
}
