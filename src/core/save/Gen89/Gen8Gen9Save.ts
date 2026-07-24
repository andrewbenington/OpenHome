import { PA8, PA9, PB8, PK8, PK9 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option } from '@openhome-core/util/functional'
import { Block, BlockType, ExtraFormIndex, Language, OriginGame } from '@pkm-rs/pkg'
import {
  ArrayBlock,
  ObjectBlock,
  SwishCrypto,
  ValueBlock,
} from '../encryption/SwishCrypto/SwishCrypto'
import { Box, BoxAndSlot, OfficialSAV } from '../interfaces'
import { PathData } from '../util/path'
import { BoxNamesBlock } from './BoxNamesBlock'

export abstract class Gen8Gen9Save<P extends PK8 | PB8 | PA8 | PK9 | PA9> extends OfficialSAV<P> {
  isPlugin: false = false
  abstract origin: OriginGame

  boxRows = 5
  boxColumns = 6
  abstract getBoxCount(): number

  filePath: PathData
  fileCreated?: Date

  scBlocks: Block[]

  money: number = 0
  name: string = ''
  abstract language: Language
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 8 current box

  boxes: Array<Box<P>>

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
  }

  abstract getMonBoxSizeBytes(): number
  abstract getBoxSizeBytes(): number
  abstract getBoxSlotGapBytes(): number

  abstract getBlockMust<T extends Block = Block>(blockName: G89BlockName, type?: BlockType): T

  abstract supportsMon(
    dexNumber: number,
    formeNumber: number,
    extraFormIndex?: ExtraFormIndex
  ): boolean

  abstract monConstructor(arg: ArrayBuffer | OHPKM, encrypted?: boolean): P

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
      const blockBuffer = boxBlock.data.Object.bytes

      // mon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (mon) {
        try {
          if (mon.gameOfOrigin && mon?.dexNum) {
            if (!(mon instanceof PK9)) {
              mon.recalculateStats()
              mon.refreshChecksum()
            }
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

  getPluginIdentifier() {
    return undefined
  }

  getMonAt(boxNum: number, boxSlot: number) {
    const box = this.boxes[boxNum]
    if (!box) return undefined
    return box.boxSlots[boxSlot]
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void {
    const box = this.boxes[boxNum]
    if (!box) return
    box.boxSlots[boxSlot] = mon
  }
}

export type G89BlockName = 'BoxLayout' | 'Box' | 'CurrentBox'
