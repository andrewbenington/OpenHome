import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Item } from '@openhome-core/resources/consts/Items'
import {
  SV_TRANSFER_RESTRICTIONS_BASE,
  SV_TRANSFER_RESTRICTIONS_ID,
  SV_TRANSFER_RESTRICTIONS_TM,
} from '@openhome-core/resources/consts/TransferRestrictions'
import {
  ArrayBlock,
  blockIsType,
  ObjectBlock,
  SwishCrypto,
  ValueBlock,
} from '@openhome-core/save/encryption/SwishCrypto/SwishCrypto'
import { BoxNamesBlock } from '@openhome-core/save/Gen89/BoxNamesBlock'
import { G89BlockName } from '@openhome-core/save/Gen89/Gen8Gen9Save'
import { Box, BoxAndSlot, PluginSAV, SlotMetadata } from '@openhome-core/save/interfaces'
import { emptyPathData, PathData } from '@openhome-core/save/util/path'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Errorable, Option } from '@openhome-core/util/functional'
import { utf16BytesToString } from '@openhome-core/util/stringConversion'
import {
  Block,
  BlockType,
  ConvertStrategy,
  ExtraFormIndex,
  Gender,
  Languages,
  OriginGame,
} from '@pkm-rs/pkg'
import PK9Compass from './PK9Compass'

const SAVE_SIZE_BYTES_MIN = 0x31626f
// const SAVE_SIZE_BYTES_MAX_SV = 0x43c000
const SAVE_SIZE_BYTES_MAX_COMPASS = 0x43d000

export type SV_SAVE_REVISION = 'Base Game' | 'Teal Mask' | 'Indigo Disk'

export class CompassSave extends PluginSAV<PK9Compass> {
  static boxSizeBytes = PK9Compass.getBoxSize() * 30
  static pkmType = PK9Compass
  static saveTypeAbbreviation = 'Compass'
  static saveTypeName = 'Pokémon Compass'
  static saveTypeID = 'CMPSAV'

  isPlugin = true as const
  pluginIdentifier = 'compass' as const

  trainerBlock: MyStatus

  origin: OriginGame

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  scBlocks: Block[]

  money: number = 0
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 9 current box

  boxes: Array<Box<PK9Compass>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxAndSlot[] = []
  constructor(path: PathData, bytes: Uint8Array) {
    super()

    this.bytes = bytes
    this.filePath = path
    this.scBlocks = SwishCrypto.decrypt(bytes)

    const currentPCBlock = this.getBlockMust<ValueBlock>('CurrentBox', {
      Scalar: { Numeric: 'UInt8' },
    })

    this.currentPCBox = new DataView(currentPCBlock.data.Value.bytes.buffer).getUint8(0)

    const boxNamesBlock = new BoxNamesBlock(this.getBlockMust<ArrayBlock>('BoxLayout', 'Array'))

    const boxBlock = this.getBlockMust<ObjectBlock>('Box', 'Object')

    this.boxes = Array(this.getBoxCount())
    for (let box = 0; box < this.getBoxCount(); box++) {
      const boxName = boxNamesBlock.getBoxName(box)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < this.getBoxCount(); box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte =
            this.getBoxSizeBytes() * box +
            (this.getMonBoxSizeBytes() + this.getBoxSlotGapBytes()) * monIndex
          const endByte = startByte + this.getMonBoxSizeBytes()
          const monData = boxBlock.data.Object.bytes.buffer.slice(startByte, endByte)

          if (!this.isEmptySlot(monData)) {
            this.boxes[box].boxSlots[monIndex] = this.monConstructor(monData, true)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    this.trainerBlock = new MyStatus(this.getBlockMust('MyStatus', 'Object'))
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

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK9Compass> {
    return PK9Compass.fromOhpkm(ohpkm, strategy)
  }

  getBoxCount(): number {
    return 32
  }

  monConstructor(bytes: ArrayBuffer, encrypted?: boolean): PK9Compass {
    return new PK9Compass(bytes, { encrypted })
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

  getMonBoxSizeBytes(): number {
    return PK9Compass.getBoxSize()
  }

  getBoxSizeBytes(): number {
    return CompassSave.boxSizeBytes
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

  get transferRestrictions() {
    const revision = this.scBlocks ? this.getSaveRevision() : 'Indigo Disk'
    switch (revision) {
      case 'Base Game':
        return SV_TRANSFER_RESTRICTIONS_BASE
      case 'Teal Mask':
        return SV_TRANSFER_RESTRICTIONS_TM
      case 'Indigo Disk':
        return SV_TRANSFER_RESTRICTIONS_ID
    }
  }

  static transferRestrictions = SV_TRANSFER_RESTRICTIONS_ID

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

  emptyBoxSlotBytes(): Uint8Array {
    const mon = this.monConstructor(new Uint8Array(this.getMonBoxSizeBytes()).buffer)

    mon.refreshChecksum()
    return new Uint8Array(mon.toPCBytes())
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    const mon = this.monConstructor(bytes, true)

    return mon.gameOfOrigin === 0 && mon.dexNum === 0
  }

  prepareForSaving() {
    const boxBlock = this.getBlockMust<ObjectBlock>('Box', 'Object')

    this.updatedBoxSlots.forEach(({ box, boxSlot }) => {
      const mon = this.getMonAt(box, boxSlot)

      const writeIndex =
        this.getBoxSizeBytes() * box +
        (this.getMonBoxSizeBytes() + this.getBoxSlotGapBytes()) * boxSlot
      const blockBuffer = new Uint8Array(boxBlock.data.Object.bytes.buffer)

      // mon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (mon) {
        try {
          if (mon.gameOfOrigin && mon?.dexNum) {
            mon.recalculateStats()
            mon.refreshChecksum()
            const monBuffer = new Uint8Array(this.getMonBoxSizeBytes())
            const pcBytes = mon.toPCBytes()

            monBuffer.set(new Uint8Array(pcBytes), 0)
            blockBuffer.set(monBuffer, writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        blockBuffer.set(this.emptyBoxSlotBytes(), writeIndex)
      }
    })

    this.bytes = SwishCrypto.encrypt(this.scBlocks, this.bytes.length)
  }

  static getPluginIdentifier() {
    return 'compass'
  }

  getMonAt(boxNum: number, boxSlot: number) {
    const box = this.boxes[boxNum]
    if (!box) return undefined
    return box.boxSlots[boxSlot]
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<PK9Compass>): void {
    const box = this.boxes[boxNum]
    if (!box) return
    box.boxSlots[boxSlot] = mon
  }

  getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined

  getDisplayData() {
    const trainerBlock = this.trainerBlock

    return {
      Language: Languages.stringFromByte(trainerBlock.getLanguage()),
      'Is Compass': String(this.getBlock('Compass_Levelcap') !== undefined),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES_MIN || bytes.length > SAVE_SIZE_BYTES_MAX_COMPASS) {
      return false
    }
    if (!SwishCrypto.getIsHashValid(bytes)) return false
    return new CompassSave(emptyPathData, bytes).getBlock('Compass_Levelcap') !== undefined
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

  constructor(scBlock: ObjectBlock) {
    this.dataView = new DataView(scBlock.data.Object.bytes.buffer)
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
