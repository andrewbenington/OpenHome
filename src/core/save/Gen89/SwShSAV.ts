import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Gender, Languages, OriginGame, SpeciesLookup } from '@pkm-rs/pkg'
import { PK8 } from '@pokemon-files/pkm'
import { utf16BytesToString } from '@pokemon-files/util'
import { Item } from '@pokemon-resources/consts/Items'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import {
  SWSH_TRANSFER_RESTRICTIONS_BASE,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  SWSH_TRANSFER_RESTRICTIONS_IOA,
} from '@pokemon-resources/consts/TransferRestrictions'
import { OHPKM } from '../../pkm/OHPKM'
import { SCBlock, SCObjectBlock } from '../encryption/SwishCrypto/SCBlock'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { PathData } from '../util/path'
import { G89BlockName, G89SAV } from './G89SAV'

const SAVE_SIZE_BYTES_MIN = 0x171500
const SAVE_SIZE_BYTES_MAX = 0x187800

export type SWSH_SAVE_REVISION = 'Base Game' | 'Isle Of Armor' | 'Crown Tundra'

export class SwShSAV extends G89SAV<PK8> {
  static boxSizeBytes = PK8.getBoxSize() * 30
  static pkmType = PK8
  static saveTypeAbbreviation = 'SwSh'
  static saveTypeName = 'Pokémon Sword/Shield'
  static saveTypeID = 'SwShSAV'

  trainerBlock: TrainerBlock
  origin: OriginGame

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.trainerBlock = new TrainerBlock(this.getBlockMust('TrainerCard', 'object'))
    this.name = this.trainerBlock.getName()

    this.tid = this.trainerBlock.getTID()
    this.sid = this.trainerBlock.getSID()
    this.displayID = (this.trainerBlock.getFullID() % 1000000).toString().padStart(6, '0')
    this.origin = this.trainerBlock.getGame()
  }

  convertOhpkm(ohpkm: OHPKM): PK8 {
    return new PK8(ohpkm)
  }

  getBoxCount(): number {
    return 30
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PK8 {
    return new PK8(bytes, encrypted)
  }

  getBlockKey(blockName: G89BlockName | keyof typeof BlockKeys): number {
    return BlockKeys[blockName]
  }

  getBlock(blockName: G89BlockName | keyof typeof BlockKeys): SCBlock | undefined {
    const key = this.getBlockKey(blockName)

    return this.scBlocks.find((b) => b.key === key)
  }

  getBlockMust<T extends SCBlock = SCBlock>(
    blockName: G89BlockName | keyof typeof BlockKeys,
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

  getBoxSlotGapBytes(): number {
    return 0
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Crown Tundra'
    switch (revision) {
      case 'Base Game':
        return !isRestricted(SWSH_TRANSFER_RESTRICTIONS_BASE, dexNumber, formeNumber)
      case 'Isle Of Armor':
        return !isRestricted(SWSH_TRANSFER_RESTRICTIONS_IOA, dexNumber, formeNumber)
      case 'Crown Tundra':
        return !isRestricted(SWSH_TRANSFER_RESTRICTIONS_CT, dexNumber, formeNumber)
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

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getSaveRevision(): SWSH_SAVE_REVISION {
    return this.getBlock('ZukanR2')
      ? 'Crown Tundra'
      : this.getBlock('ZukanR1')
        ? 'Isle Of Armor'
        : 'Base Game'
  }

  getDisplayData() {
    const trainerBlock = this.trainerBlock

    const pokedexOwned = trainerBlock.getPokeDexOwned()

    if (pokedexOwned === 0xffff) {
      return { Status: 'New Save File' }
    }

    return {
      'Player Character': trainerBlock.getGender() ? 'Gloria' : 'Victor',
      'Save Version': this.getSaveRevision(),
      Language: Languages.stringFromByte(trainerBlock.getLanguage()),
      Pokédex: pokedexOwned,
      'Shiny Pokémon Found': trainerBlock.getShinyPokemonFound(),
      Starter: trainerBlock.getStarter(),
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

  get trainerGender(): Gender {
    return this.trainerBlock.getGender() ? Gender.Female : Gender.Male
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
      return SpeciesLookup(index * 3 + NationalDex.Grookey)?.name ?? 'Unknown'
    }

    return 'Not Selected'
  }
}
