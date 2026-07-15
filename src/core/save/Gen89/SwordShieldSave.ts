import { PK8 } from '@openhome-core/pkm'
import { Item } from '@openhome-core/resources/consts/Items'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import {
  SWSH_TRANSFER_RESTRICTIONS_BASE,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  SWSH_TRANSFER_RESTRICTIONS_IOA,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Errorable, Option } from '@openhome-core/util/functional'
import { utf16BytesToString } from '@openhome-core/util/stringConversion'
import {
  BinaryGender,
  Block,
  BlockType,
  ConvertStrategy,
  ExtraFormIndex,
  Language,
  Languages,
  Lookup,
  OriginGame,
  Pk8Wasm,
  SwordShieldSaveRust,
} from '@pkm-rs/pkg'
import { OHPKM } from '../../pkm/OHPKM'
import {
  blockIsType,
  ObjectBlock,
  SwishCrypto,
  ValueBlock,
} from '../encryption/SwishCrypto/SwishCrypto'
import { BoxAndSlot, WasmOfficialSave } from '../interfaces'
import { PathData } from '../util/path'
import { G89BlockName } from './Gen8Gen9Save'

const SAVE_SIZE_BYTES_MIN = 0x171500
const SAVE_SIZE_BYTES_MAX = 0x187800

export type SWSH_SAVE_REVISION = 'Base Game' | 'Isle Of Armor' | 'Crown Tundra'

export class SwordShieldSave extends WasmOfficialSave<PK8, Pk8Wasm, SwordShieldSaveRust> {
  MAX_BOX_COUNT: number = SwordShieldSaveRust.MAX_BOX_COUNT
  SLOTS_PER_BOX: number = SwordShieldSaveRust.SLOTS_PER_BOX

  static boxSizeBytes = PK8.getBoxSize() * 30
  static pkmType = PK8
  static saveTypeAbbreviation = 'SwSh'
  static saveTypeName = 'Pokémon Sword/Shield'
  static saveTypeID = 'SwShSAV'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 8 money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  scBlocks: Block[]

  trainerCardBlock: TrainerCardBlock
  currentPCBox: number

  constructor(path: PathData, bytes: Uint8Array) {
    super(SwordShieldSaveRust.fromBytes(bytes))
    this.scBlocks = SwishCrypto.decrypt(bytes)
    this.filePath = path

    const currentPCBlock = this.getBlockMust<ValueBlock>('CurrentBox', {
      Scalar: { Numeric: 'UInt8' },
    })
    this.trainerCardBlock = new TrainerCardBlock(this.getBlockMust('TrainerCard', 'Object'))

    this.currentPCBox = new DataView(currentPCBlock.data.Value.bytes.buffer).getUint8(0)
  }

  get bytes() {
    return this.inner.prepareBytesForSaving()
  }

  get boxRows() {
    return SwordShieldSaveRust.BOX_ROWS
  }

  get boxColumns() {
    return SwordShieldSaveRust.BOX_COLS
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK8> {
    return PK8.fromOhpkm(ohpkm, strategy)
  }

  getBoxCount(): number {
    return 32
  }

  monConstructor(buffer: ArrayBuffer, encrypted: boolean): PK8 {
    return PK8.fromBytes(buffer, encrypted)
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    return Pk8Wasm.isEmptySlot(new Uint8Array(bytes))
  }

  emptyBoxSlotBytes() {
    return Pk8Wasm.emptyBoxSlotBytes(this.name)
  }

  getBlockKey(blockName: G89BlockName | keyof typeof BlockKeys): number {
    return BlockKeys[blockName]
  }

  getBlock(blockName: G89BlockName | keyof typeof BlockKeys): Block | undefined {
    const key = this.getBlockKey(blockName)

    return this.scBlocks.find((b) => b.key === key)
  }

  getBlockMust<T extends Block = Block>(
    blockName: G89BlockName | keyof typeof BlockKeys,
    type?: BlockType
  ): T {
    const block = this.getBlock(blockName)

    if (!block) {
      throw Error(`Missing block ${blockName}`)
    }
    if (type && !blockIsType(block, type)) {
      throw Error(
        `Block ${blockName} has data ${JSON.stringify(block.data)} (expected ${JSON.stringify(type)})`
      )
    }
    return block as T
  }

  getMonAt(boxIndex: number, boxSlot: number): PK8 | undefined {
    let pk8Wasm = this.inner.getMonAt(boxIndex, boxSlot)
    return pk8Wasm ? PK8.fromWasm(pk8Wasm) : undefined
  }

  setMonAt(boxIndex: number, boxSlot: number, mon: Option<PK8>): void {
    this.inner.setMonAt(boxIndex, boxSlot, mon?.inner)
  }

  monFromWasm(wasmMon: Pk8Wasm): PK8 {
    return PK8.fromWasm(wasmMon)
  }

  getMonBoxSizeBytes(): number {
    return PK8.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return SwordShieldSave.boxSizeBytes
  }

  getBoxSlotGapBytes(): number {
    return 0
  }

  getBoxName(boxIndex: number) {
    return this.inner.getBoxName(boxIndex)
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Crown Tundra'
    switch (revision) {
      case 'Base Game':
        return !isRestricted(
          SWSH_TRANSFER_RESTRICTIONS_BASE,
          dexNumber,
          formeNumber,
          extraFormIndex
        )
      case 'Isle Of Armor':
        return !isRestricted(SWSH_TRANSFER_RESTRICTIONS_IOA, dexNumber, formeNumber, extraFormIndex)
      case 'Crown Tundra':
        return !isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, dexNumber, formeNumber, extraFormIndex)
    }
  }

  supportsItem(itemIndex: number) {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Crown Tundra'
    switch (revision) {
      case 'Base Game':
        return itemIndex <= Item.DynamaxCrystalAql7235
      case 'Isle Of Armor':
        return itemIndex <= Item.MarkCharm
      case 'Crown Tundra':
        return itemIndex <= Item.ReinsOfUnity_3
    }
  }

  getSaveRevision(): SWSH_SAVE_REVISION {
    return this.getBlock('ZukanR2')
      ? 'Crown Tundra'
      : this.getBlock('ZukanR1')
        ? 'Isle Of Armor'
        : 'Base Game'
  }

  getDisplayData() {
    const pokedexOwned = this.trainerCardBlock.getPokeDexOwned()

    if (pokedexOwned === 0xffff) {
      return { Status: 'New Save File' }
    }

    return {
      'Player Character': this.inner.trainerGender ? 'Gloria' : 'Victor',
      'Save Version': this.getSaveRevision(),
      Language: Languages.stringFromByte(this.inner.language || 0),
      Pokédex: pokedexOwned,
      'Shiny Pokémon Found': this.trainerCardBlock.getShinyPokemonFound(),
      Starter: this.trainerCardBlock.getStarter(),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES_MIN || bytes.length > SAVE_SIZE_BYTES_MAX) {
      return false
    }
    return SwishCrypto.getIsHashValid(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Sword || origin === OriginGame.Shield
  }

  get trainerGender(): BinaryGender {
    return this.inner.trainerGender
  }

  get language() {
    return this.inner.language
  }
}

const BlockKeys = {
  MyStatus: 0xf25c070e,
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

class TrainerCardBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: ObjectBlock) {
    this.dataView = new DataView(scBlock.data.Object.bytes.buffer)
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
  public getTID(): number {
    return this.dataView.getUint16(0x1c, true)
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
  public getGame(): OriginGame {
    const origin = this.dataView.getUint8(0x24)

    return origin === 0 ? OriginGame.Sword : OriginGame.Shield
  }
  public getGender(): boolean {
    return !!(this.dataView.getUint8(0x38) & 1)
  }
  public getStarter(): string {
    const index = this.dataView.getUint8(0x25)

    if (index <= 2) {
      const nationalDex = NationalDex.Grookey + index * 3
      return Lookup.speciesName(nationalDex, Language.English)
    }

    return 'Not Selected'
  }
}
