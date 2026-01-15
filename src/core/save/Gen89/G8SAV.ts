import { OriginGame } from '@pkm-rs/pkg'
import { PA8, PB8, PK8, PK9 } from '@pokemon-files/pkm'
import { AllPKMFields } from '@pokemon-files/util'
import { OhpkmTracker } from '../../../tracker'
import {
  SCArrayBlock,
  SCBlock,
  SCObjectBlock,
  SCValueBlock,
} from '../encryption/SwishCrypto/SCBlock'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { Box, OfficialSAV, SaveMonLocation } from '../interfaces'
import { PathData } from '../util/path'
import { BoxNamesBlock } from './BoxNamesBlock'

export abstract class G89SAV<P extends PK8 | PB8 | PA8 | PK9> extends OfficialSAV<P> {
  isPlugin: false = false
  abstract origin: OriginGame

  boxRows = 5
  boxColumns = 6
  abstract getBoxCount(): number

  filePath: PathData
  fileCreated?: Date

  scBlocks: SCBlock[]

  money: number = 0
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 8 current box

  boxes: Array<Box<P>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: SaveMonLocation[] = []

  constructor(path: PathData, bytes: Uint8Array, tracker: OhpkmTracker) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.scBlocks = SwishCrypto.decrypt(bytes)

    const currentPCBlock = this.getBlockMust<SCValueBlock>('CurrentBox', 'value')

    this.currentPCBox = new DataView(currentPCBlock.raw).getUint8(0)

    const boxNamesBlock = new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))

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
          const mon = this.monConstructor(monData, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].boxSlots[monIndex] = tracker.wrapWithIdentifier(mon, undefined)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  abstract getMonBoxSizeBytes(): number
  abstract getBoxSizeBytes(): number

  abstract getBlockMust<T extends SCBlock = SCBlock>(
    blockName: G89BlockName,
    type?: T['blockType']
  ): T

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  abstract getCurrentBox(): Box<P>

  abstract monConstructor(arg: ArrayBuffer | AllPKMFields, encrypted?: boolean): P

  prepareForSaving() {
    const boxBlock = this.getBlockMust<SCObjectBlock>('Box', 'object')

    this.updatedBoxSlots.forEach(({ box, index }) => {
      const updatedSlotContent = this.boxes[box].boxSlots[index]

      const writeIndex = this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * index
      const blockBuffer = new Uint8Array(boxBlock.raw)

      // updatedSlotContent will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (updatedSlotContent) {
        try {
          const mon = updatedSlotContent.data

          if (mon.gameOfOrigin && mon?.dexNum) {
            if ('stats' in mon) {
              mon.stats = mon.getStats()
            }
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
        const mon = this.monConstructor(new Uint8Array(this.getMonBoxSizeBytes()).buffer)

        mon.refreshChecksum()
        blockBuffer.set(new Uint8Array(mon.toPCBytes()), writeIndex)
      }
    })

    this.bytes = SwishCrypto.encrypt(this.scBlocks, this.bytes.length)
  }

  getPluginIdentifier() {
    return undefined
  }
}

export type G89BlockName = 'BoxLayout' | 'Box' | 'CurrentBox'
