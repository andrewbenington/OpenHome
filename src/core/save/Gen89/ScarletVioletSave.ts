import { PK9 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SCBlock, SCObjectBlock } from '@openhome-core/save/encryption/SwishCrypto/SCBlock'
import { SwishCrypto } from '@openhome-core/save/encryption/SwishCrypto/SwishCrypto'
import { G89BlockName, Gen8Gen9Save } from '@openhome-core/save/Gen89/Gen8Gen9Save'
import { emptyPathData, PathData } from '@openhome-core/save/util/path'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { utf16BytesToString } from '@openhome-core/util/stringConversion'
import { ConvertStrategy, ExtraFormIndex, Gender, Languages, OriginGame } from '@pkm-rs/pkg'
import { Item } from '@pokemon-resources/consts/Items'
import {
  SV_TRANSFER_RESTRICTIONS_BASE,
  SV_TRANSFER_RESTRICTIONS_ID,
  SV_TRANSFER_RESTRICTIONS_TM,
} from '@pokemon-resources/consts/TransferRestrictions'

const SAVE_SIZE_BYTES_MIN = 0x31626f
const SAVE_SIZE_BYTES_MAX = 0x43c000

export type SV_SAVE_REVISION = 'Base Game' | 'Teal Mask' | 'Indigo Disk'

export class ScarletVioletSave extends Gen8Gen9Save<PK9> {
  static boxSizeBytes = PK9.getBoxSize() * 30
  static pkmType = PK9
  static saveTypeAbbreviation = 'SV'
  static saveTypeName = 'Pokémon Scarlet/Violet'
  static saveTypeID = 'SVSAV'

  trainerBlock: MyStatus

  origin: OriginGame

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.trainerBlock = new MyStatus(this.getBlockMust('MyStatus', 'object'))
    this.name = this.trainerBlock.getName()

    this.boxes.forEach((box, i) => {
      if (!box.name) {
        box.name = `Box ${i + 1}`
      }
    })

    this.tid = this.trainerBlock.getTID()
    this.sid = this.trainerBlock.getSID()
    this.displayID = this.trainerBlock.getFullID().toString().slice(-6).padStart(6, '0')
    this.origin = this.trainerBlock.getGame()
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PK9 {
    return PK9.fromOhpkm(ohpkm, strategy)
  }

  getBoxCount(): number {
    return 32
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PK9 {
    return new PK9(bytes, { encrypted })
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
    return PK9.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return ScarletVioletSave.boxSizeBytes
  }

  getBoxSlotGapBytes(): number {
    return 0
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Indigo Disk'
    switch (revision) {
      case 'Base Game':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_BASE, dexNumber, formeNumber, extraFormIndex)
      case 'Teal Mask':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_TM, dexNumber, formeNumber, extraFormIndex)
      case 'Indigo Disk':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_ID, dexNumber, formeNumber, extraFormIndex)
    }
  }

  supportsItem(itemIndex: number) {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Indigo Disk'
    switch (revision) {
      case 'Base Game':
        return itemIndex <= Item.YellowDish
      case 'Teal Mask':
        return itemIndex <= Item.GlimmeringCharm
      case 'Indigo Disk':
        return itemIndex <= Item.BriarsBook
    }
  }

  getSaveRevision(): SV_SAVE_REVISION {
    return this.getBlock('BlueberryPoints')
      ? 'Indigo Disk'
      : this.getBlock('TeraRaidDLC')
        ? 'Teal Mask'
        : 'Base Game'
  }

  getDisplayData(): Record<string, string | number | undefined> {
    const trainerBlock = this.trainerBlock

    return {
      'Player Character': trainerBlock.getGender() ? 'Juliana' : 'Florian',
      'Save Version': this.getSaveRevision(),
      Language: Languages.stringFromByte(trainerBlock.getLanguage()),
      'Is Compass': String(this.getBlock('Compass_Levelcap') !== undefined),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES_MIN || bytes.length > SAVE_SIZE_BYTES_MAX) {
      return false
    }
    if (!SwishCrypto.getIsHashValid(bytes)) return false
    // ensure this isn't Pokémon Compass
    return new ScarletVioletSave(emptyPathData, bytes).getBlock('Compass_Levelcap') === undefined
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Scarlet || origin === OriginGame.Violet
  }

  get trainerGender() {
    return this.trainerBlock.getGender() ? Gender.Female : Gender.Male
  }

  get language() {
    return this.trainerBlock.getLanguage()
  }
}

const BlockKeys = {
  TeamNames: 0x1920c1e4,
  TeamIndexes: 0x33f39467,
  BoxLayout: 0x19722c89,
  BoxWallpapers: 0x2eb1b190,

  Box: 0x0d66012c,
  Party: 0x3aa1a9ad,
  Zukan: 0x0deaaebd,
  ZukanT1: 0xf5d7c0e2,
  MyStatus: 0xe3e89bd1,
  PlayTime: 0xedaff794,

  CurrentBox: 0x017c3cbb,

  TeraRaidDLC: 0x100b93da,
  BlueberryPoints: 0x66a33824,

  Compass_Levelcap: 0xcc806ed6,
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
  public getTID(): number {
    return this.dataView.getUint16(0x00, true)
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
