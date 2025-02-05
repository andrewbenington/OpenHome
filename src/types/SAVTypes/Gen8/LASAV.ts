import { PA8 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { LA_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import {
  SCArrayBlock,
  SCBlock,
  SCObjectBlock,
  SCValueBlock,
} from '../../../util/SwishCrypto/SCBlock'
import { SwishCrypto } from '../../../util/SwishCrypto/SwishCrypto'
import { OHPKM } from '../../pkm/OHPKM'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { Box } from '../SAV'
import { BoxNamesBlock } from './BoxNamesBlock'
import { G8BlockName, G8SAV } from './G8SAV'
import { MyStatusBlock } from './MyStatusBlock'

const SAVE_SIZE_BYTES = 1273310

export class LASAV extends G8SAV<PA8> {
  static boxSizeBytes = PA8.getBoxSize() * 30
  static pkmType = PA8
  static saveTypeAbbreviation = 'LA'
  static saveTypeName = 'Pokémon Legends Arceus'
  static saveTypeID = 'LASAV'

  myStatusBlock: MyStatusBlock
  scBlocks: SCBlock[]

  boxes: Box<PA8>[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    const dataBeforeHash = bytes.slice(0, -SwishCrypto.SIZE_HASH)
    const dataAfterXor = SwishCrypto.cryptStaticXorpadBytes(dataBeforeHash)
    this.scBlocks = SwishCrypto.readBlocks(dataAfterXor)

    const currentPCBlock = this.getBlockMust<SCValueBlock>('CurrentBox', 'value')
    this.currentPCBox = new DataView(currentPCBlock.raw).getUint8(0) + 1

    this.myStatusBlock = new MyStatusBlock(this.getBlockMust('MyStatus', 'object'))
    this.name = this.myStatusBlock.getName()

    const fullTrainerID = this.myStatusBlock.getFullID()
    this.tid = fullTrainerID % 1000000
    this.sid = this.myStatusBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = GameOfOrigin.LegendsArceus

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

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  getBoxCount(): number {
    return 24
  }

  buildPKM(bytes: ArrayBuffer, encrypted: boolean): PA8 {
    return new PA8(bytes, encrypted)
  }

  getBlockKey(blockName: G8BlockName | keyof typeof BlockKeys): number {
    return BlockKeys[blockName]
  }

  getBlock(blockName: G8BlockName | keyof typeof BlockKeys): SCBlock | undefined {
    const key = this.getBlockKey(blockName)
    return this.scBlocks.find((b) => b.key === key)
  }

  getBlockMust<T extends SCBlock = SCBlock>(
    blockName: G8BlockName | keyof typeof BlockKeys,
    type?: T['blockType']
  ): T {
    const block = this.getBlock(blockName)
    if (!block) {
      throw Error(`Missing block ${blockName}`)
    }
    if (type && block.blockType !== type) {
      throw Error(`Block ${blockName} is type ${block.blockType} (expected ${type})`)
    }
    return block as T
  }

  getBoxNamesBlock = () => new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))

  getMonBoxSizeBytes(): number {
    return 360
  }

  getBoxSizeBytes(): number {
    return LASAV.boxSizeBytes
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
    //   const writeIndex = this.pcOffset + SwShSAV.boxSizeBytes * box + PK8.getBoxSize() * index

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
    return !isRestricted(LA_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  // calculateChecksum(): number {
  //   return CRC16_Invert(this.bytes, this.pcOffset, this.pcSize)
  // }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    return 'Pokémon Legends Arceus'
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

const BlockKeys = {
  BoxLayout: 0x19722c89,
  Box: 0x47e1ceab,
  MyStatus: 0xf25c070e,
  CurrentBox: 0x017c3cbb,
}
