import { PA8, utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin, Languages } from 'pokemon-resources'
import { LA_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import { isRestricted } from '../../TransferRestrictions'
import { PathData } from '../path'
import { BoxNamesBlock } from './BoxNamesBlock'
import { G89BlockName, G89SAV } from './G8SAV'
import { SCArrayBlock, SCBlock, SCObjectBlock } from './SwishCrypto/SCBlock'
import { SwishCrypto } from './SwishCrypto/SwishCrypto'

export type LA_SAVE_REVISION = 'Base' | 'Daybreak'

const SAVE_SIZE_MIN = 0x136c00
const SAVE_SIZE_MAX = 0x13ae00

export class LASAV extends G89SAV<PA8> {
  static boxSizeBytes = PA8.getBoxSize() * 30
  static pkmType = PA8
  static saveTypeAbbreviation = 'LA'
  static saveTypeName = 'Pokémon Legends Arceus'
  static saveTypeID = 'LASAV'

  myStatusBlock: MyStatusBlock

  constructor(path: PathData, bytes: Uint8Array) {
    super(path, bytes)

    this.myStatusBlock = new MyStatusBlock(this.getBlockMust('MyStatus', 'object'))
    this.name = this.myStatusBlock.getName()

    const fullTrainerID = this.myStatusBlock.getFullID()

    this.tid = fullTrainerID % 1000000
    this.sid = this.myStatusBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = GameOfOrigin.LegendsArceus
  }

  getBoxCount(): number {
    return 24
  }

  monConstructor(bytes: ArrayBuffer, encrypted: boolean): PA8 {
    return new PA8(bytes, encrypted)
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

  getBoxNamesBlock = () => new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))

  getMonBoxSizeBytes(): number {
    return 360
  }

  getBoxSizeBytes(): number {
    return LASAV.boxSizeBytes
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

  getSaveRevision(): LA_SAVE_REVISION {
    return this.getBlock('Daybreak') ? 'Daybreak' : 'Base'
  }

  getDisplayData() {
    return {
      'Save Version': this.getSaveRevision(),
      'Player Character': this.myStatusBlock.getGender() ? 'Akari' : 'Rei',
      Language: Languages[this.myStatusBlock.getLanguage()],
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_MIN || bytes.length > SAVE_SIZE_MAX) {
      return false
    }

    return SwishCrypto.getIsHashValid(bytes)
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.LegendsArceus
  }
}

const BlockKeys = {
  BoxLayout: 0x19722c89,
  Box: 0x47e1ceab,
  MyStatus: 0xf25c070e,
  CurrentBox: 0x017c3cbb,
  Daybreak: 0x8184efb4,
}

class MyStatusBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: SCObjectBlock) {
    this.dataView = new DataView(scBlock.raw)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0x20, 24)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x10, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x12, true)
  }
  public getGender(): boolean {
    return !!(this.dataView.getUint8(0x15) & 1)
  }
  public getLanguage(): number {
    return this.dataView.getUint8(0x17)
  }
}
