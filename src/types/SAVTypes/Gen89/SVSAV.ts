import { Languages, OriginGame } from '@pkm-rs-resources/pkg'
import { PK9 } from '@pokemon-files/pkm'
import { utf16BytesToString } from '@pokemon-files/util'
import {
  SV_TRANSFER_RESTRICTIONS_BASE,
  SV_TRANSFER_RESTRICTIONS_ID,
  SV_TRANSFER_RESTRICTIONS_TM,
} from '../../../consts/TransferRestrictions'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { G89BlockName, G89SAV } from './G8SAV'
import { SCBlock, SCObjectBlock } from './SwishCrypto/SCBlock'
import { SwishCrypto } from './SwishCrypto/SwishCrypto'

const SAVE_SIZE_BYTES_MIN = 0x31626f
const SAVE_SIZE_BYTES_MAX = 0x43c000

export type SV_SAVE_REVISION = 'Base Game' | 'Teal Mask' | 'Indigo Disk'

export class SVSAV extends G89SAV<PK9> {
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

  getBoxCount(): number {
    return 32
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PK9 {
    return new PK9(bytes, encrypted)
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
    return SVSAV.boxSizeBytes
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Indigo Disk'
    const restrictions =
      revision === 'Base Game'
        ? SV_TRANSFER_RESTRICTIONS_BASE
        : revision === 'Teal Mask'
          ? SV_TRANSFER_RESTRICTIONS_TM
          : SV_TRANSFER_RESTRICTIONS_ID

    return !isRestricted(restrictions, dexNumber, formeNumber)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getSaveRevision(): SV_SAVE_REVISION {
    return this.getBlock('BlueberryPoints')
      ? 'Indigo Disk'
      : this.getBlock('TeraRaidDLC')
        ? 'Teal Mask'
        : 'Base Game'
  }

  getDisplayData() {
    const trainerBlock = this.trainerBlock

    return {
      'Player Character': trainerBlock.getGender() ? 'Juliana' : 'Florian',
      'Save Version': this.getSaveRevision(),
      Language: Languages.stringFromByte(trainerBlock.getLanguage()),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES_MIN || bytes.length > SAVE_SIZE_BYTES_MAX) {
      return false
    }
    return SwishCrypto.getIsHashValid(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Scarlet || origin === OriginGame.Violet
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
