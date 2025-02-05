import { PK8, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { SWSH_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
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

const SAVE_SIZE_BYTES = 1575705

export class SwShSAV extends G8SAV<PK8> {
  static boxSizeBytes = PK8.getBoxSize() * 30
  static pkmType = PK8
  static saveTypeAbbreviation = 'SwSh'
  static saveTypeName = 'Pokémon Sword/Shield'
  static saveTypeID = 'SwShSAV'

  trainerBlock: TrainerBlock
  scBlocks: SCBlock[]

  boxes: Box<PK8>[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    const dataBeforeHash = bytes.slice(0, -SwishCrypto.SIZE_HASH)
    const dataAfterXor = SwishCrypto.cryptStaticXorpadBytes(dataBeforeHash)
    this.scBlocks = SwishCrypto.readBlocks(dataAfterXor)

    const currentPCBlock = this.getBlockMust<SCValueBlock>('CurrentBox', 'value')
    this.currentPCBox = new DataView(currentPCBlock.raw).getUint8(0) + 1

    this.trainerBlock = new TrainerBlock(this.getBlockMust('TrainerCard', 'object'))
    this.name = this.trainerBlock.getName()
    const fullTrainerID = this.trainerBlock.getFullID()

    this.tid = fullTrainerID % 1000000
    this.sid = this.trainerBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.trainerBlock.getGame()

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

  getBoxNamesBlock() {
    return new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))
  }

  getBoxCount(): number {
    return 30
  }

  buildPKM(bytes: ArrayBuffer, encrypted: boolean): PK8 {
    return new PK8(bytes, encrypted)
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

  getMonBoxSizeBytes(): number {
    return PK8.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return SwShSAV.boxSizeBytes
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
    return !isRestricted(SWSH_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
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

const BlockKeys = {
  TeamNames: 0x1920c1e4,
  TeamIndexes: 0x33f39467,
  BoxLayout: 0x19722c89,
  BoxWallpapers: 0x2eb1b190,
  MenuButtons: 0xb1dddca8,

  Box: 0x0d66012c,
  MysteryGift: 0x112d5141,
  Item: 0x1177c2c4,
  Coordinates: 0x16aaa7fa,
  Misc: 0x1b882b09,
  Party: 0x2985fe5d,
  Daycare: 0x2d6fba6a,
  Record: 0x37da95a3,
  Zukan: 0x4716c404,
  ZukanR1: 0x3f936ba9,
  ZukanR2: 0x3c9366f0,
  PokedexRecommendation: 0xc3fb9e77,
  CurryDex: 0x6eb72940,
  TrainerCard: 0x874da6fa,
  PlayTime: 0x8cbbfd90,

  CurrentBox: 0x017c3cbb,
  BoxesUnlocked: 0x71825204,
}

class TrainerBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: SCObjectBlock) {
    this.dataView = new DataView(scBlock.raw)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0, 24)
  }
  public getLanguage(): number {
    return this.dataView.getUint8(0x1b)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x1c, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x1e, true)
  }
  public getPokeDexOwned(): number {
    return this.dataView.getUint16(0x20, true)
  }
  public getShinyPokemonFound(): number {
    return this.dataView.getUint16(0x22, true)
  }
  public getGame(): GameOfOrigin {
    const origin = this.dataView.getUint8(0x24)
    return origin === 0
      ? GameOfOrigin.Sword
      : origin === 1
        ? GameOfOrigin.Shield
        : GameOfOrigin.INVALID_0
  }
  public getGender(): boolean {
    return !!(this.dataView.getUint8(0x38) & 1)
  }
}
