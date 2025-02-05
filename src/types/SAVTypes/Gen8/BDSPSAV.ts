import { PB8, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { BDSP_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { SCBlock, SCObjectBlock } from '../../../util/SwishCrypto/SCBlock'
import { OHPKM } from '../../pkm/OHPKM'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { Box } from '../SAV'
import { G8BlockName, G8SAV } from './G8SAV'

const SAVE_SIZE_BYTES = 1575705
const BOX_COUNT = 40
const BOX_NAME_LENGTH = 0x22

export class BDSPSAV extends G8SAV<PB8> {
  static boxSizeBytes = PB8.getBoxSize() * 30
  static pkmType = PB8
  static saveTypeAbbreviation = 'BDSP'
  static saveTypeName = 'Pokémon Brilliant Diamond/Shining Pearl'
  static saveTypeID = 'BDSPSAV'

  myStatusBlock: MyStatusBlock
  boxes: Box<PB8>[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.myStatusBlock = new MyStatusBlock(bytes)

    this.name = this.myStatusBlock.getName()
    const fullTrainerID = this.myStatusBlock.getFullID()

    this.tid = fullTrainerID % 1000000
    this.sid = this.myStatusBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.myStatusBlock.getGame()

    const boxNamesBlock = this.getBoxNamesBlock()

    const boxBlock = this.getBlockMust<SCObjectBlock>('Box', 'object')
    this.boxes = Array(this.getBoxCount())
    for (let box = 0; box < this.getBoxCount(); box++) {
      const boxName = boxNamesBlock.getBoxName(box)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < this.getBoxCount(); box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * monIndex
          const endByte = startByte + this.getMonBoxSizeBytes()
          const monData = boxBlock.raw.slice(startByte, endByte)
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

  getBoxCount = () => BOX_COUNT

  buildPKM(bytes: ArrayBuffer, encrypted: boolean): PB8 {
    return new PB8(bytes, encrypted)
  }

  getBlock(blockName: G8BlockName | 'MyStatus'): SCBlock | undefined {
    switch (blockName) {
      case 'BoxLayout': {
        return {
          blockType: 'object',
          key: 0,
          raw: this.bytes.slice(0x148aa, 0x148aa + 0x64a).buffer,
          type: 0,
        }
      }
      case 'MyStatus': {
        return {
          blockType: 'object',
          key: 0,
          raw: this.bytes.slice(0x148aa, 0x148aa + 0x64a).buffer,
          type: 0,
        }
      }
    }
  }

  getBlockMust<T extends SCBlock = SCBlock>(blockName: G8BlockName, type?: T['blockType']): T {
    const block = this.getBlock(blockName)
    if (!block) {
      throw Error(`Missing block ${blockName}`)
    }
    if (type && block.blockType !== type) {
      throw Error(`Block ${blockName} is type ${block.blockType} (expected ${type})`)
    }
    return block as T
  }

  getBoxNamesBlock = () => new BoxLayoutBDSP(this.bytes)

  getMonBoxSizeBytes(): number {
    return PB8.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return BDSPSAV.boxSizeBytes
  }

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

  // calculateChecksum(): number {
  //   return CRC16_Invert(this.bytes, this.pcOffset, this.pcSize)
  // }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length !== SAVE_SIZE_BYTES) {
      return false
    }
    return true
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.Sword || origin === GameOfOrigin.Shield
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
