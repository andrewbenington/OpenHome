import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Gender, Languages, OriginGame } from '@pkm-rs/pkg'
import { PA9 } from '@pokemon-files/pkm'
import { utf16BytesToString } from '@pokemon-files/util'
import { Item } from '@pokemon-resources/consts/Items'
import {
  ZA_TRANSFER_RESTRICTIONS_BASE,
  ZA_TRANSFER_RESTRICTIONS_MD,
} from '@pokemon-resources/consts/TransferRestrictions'
import { OHPKM } from '../../pkm/OHPKM'
import { SCBlock, SCObjectBlock } from '../encryption/SwishCrypto/SCBlock'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { emptyPathData, PathData } from '../util/path'
import { G89BlockName, G89SAV } from './G89SAV'

export type ZA_SAVE_REVISION = 'Base Game' | 'Mega Dimension'

const BOX_SLOT_GAP_BYTES = 0x40

export class ZASAV extends G89SAV<PA9> {
  static boxSizeBytes = (PA9.getBoxSize() + BOX_SLOT_GAP_BYTES) * 30
  static pkmType = PA9
  static saveTypeAbbreviation = 'SV'
  static saveTypeName = 'Pokémon Scarlet/Violet'
  static saveTypeID = 'SVSAV'

  trainerBlock: MyStatus

  origin: OriginGame

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.trainerBlock = new MyStatus(this.getBlockMust('MyStatus', 'object'))
    this.name = this.trainerBlock.getName()
    const fullTrainerID = this.trainerBlock.getFullID()

    this.boxes.forEach((box, i) => {
      if (!box.name) {
        box.name = `Box ${i + 1}`
      }
    })

    this.tid = fullTrainerID % 1000000
    this.sid = this.trainerBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.trainerBlock.getGame()
  }

  convertOhpkm(ohpkm: OHPKM): PA9 {
    return new PA9(ohpkm)
  }

  getBoxCount(): number {
    return 32
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PA9 {
    return new PA9(bytes, encrypted)
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
    return PA9.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return ZASAV.boxSizeBytes
  }

  getBoxSlotGapBytes(): number {
    return BOX_SLOT_GAP_BYTES
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Mega Dimension'
    switch (revision) {
      case 'Base Game':
        return !isRestricted(ZA_TRANSFER_RESTRICTIONS_BASE, dexNumber, formeNumber)
      case 'Mega Dimension':
        return !isRestricted(ZA_TRANSFER_RESTRICTIONS_MD, dexNumber, formeNumber)
    }
  }

  supportsItem(itemIndex: number) {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Mega Dimension'
    switch (revision) {
      case 'Base Game':
        return itemIndex <= Item.Falinksite
      case 'Mega Dimension':
        return itemIndex <= Item.Glimmoranite
    }
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getSaveRevision(): ZA_SAVE_REVISION {
    return this.getBlock('Donuts') ? 'Mega Dimension' : 'Base Game'
  }

  getDisplayData() {
    const trainerBlock = this.trainerBlock

    return {
      'Player Character': trainerBlock.getGender() ? 'Harmony' : 'Paxton',
      'Save Version': this.getSaveRevision(),
      Language: Languages.stringFromByte(trainerBlock.getLanguage()),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    try {
      if (!SwishCrypto.getIsHashValid(bytes)) {
        return false
      }

      const maybeSave = new ZASAV(emptyPathData, bytes)
      return maybeSave.getBlock('InfiniteRoyale') !== undefined
    } catch {
      return false
    }
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Scarlet || origin === OriginGame.Violet
  }

  get trainerGender() {
    return this.trainerBlock.getGender() ? Gender.Female : Gender.Male
  }
}

const BlockKeys = {
  TeamIndexes: 0x33f39467,
  BoxLayout: 0x19722c89,
  BoxWallpapers: 0x2eb1b190,

  Box: 0x0d66012c,
  Party: 0x3aa1a9ad,
  Zukan: 0x2d87be5c,
  MyStatus: 0xe3e89bd1,
  PlayTime: 0xedaff794,

  CurrentBox: 0x017c3cbb,

  InfiniteRoyale: 0x8929bfb6,
  Donuts: 0xbe007476,
}

class MyStatus {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: SCObjectBlock) {
    this.dataView = new DataView(scBlock.raw)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0x10, 24)
  }
  public getLanguage(): number {
    return this.dataView.getUint8(0x07)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x00, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x02, true)
  }
  public getGame(): OriginGame {
    return this.dataView.getUint8(0x04)
  }
  public getGender(): boolean {
    return !!(this.dataView.getUint8(0x05) & 1)
  }
}
