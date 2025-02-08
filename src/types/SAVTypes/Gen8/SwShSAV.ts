import { PK8, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { SWSH_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { SCBlock, SCObjectBlock } from '../../../util/SwishCrypto/SCBlock'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { G8BlockName, G8SAV } from './G8SAV'

const SAVE_SIZE_BYTES = 1_575_705
const SAVE_SIZE_BYTES_1_3_0 = 1_603_500

export class SwShSAV extends G8SAV<PK8> {
  static boxSizeBytes = PK8.getBoxSize() * 30
  static pkmType = PK8
  static saveTypeAbbreviation = 'SwSh'
  static saveTypeName = 'Pokémon Sword/Shield'
  static saveTypeID = 'SwShSAV'

  trainerBlock: TrainerBlock

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.trainerBlock = new TrainerBlock(this.getBlockMust('TrainerCard', 'object'))
    this.name = this.trainerBlock.getName()
    const fullTrainerID = this.trainerBlock.getFullID()

    this.tid = fullTrainerID % 1000000
    this.sid = this.trainerBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.trainerBlock.getGame()
  }

  getBoxCount(): number {
    return 30
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PK8 {
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
    if (bytes.length < SAVE_SIZE_BYTES || bytes.length > SAVE_SIZE_BYTES_1_3_0) {
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
