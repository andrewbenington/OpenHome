import { PA8, PB8, PK8 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import {
  SCArrayBlock,
  SCBlock,
  SCObjectBlock,
  SCValueBlock,
} from '../../../util/SwishCrypto/SCBlock'
import { SwishCrypto } from '../../../util/SwishCrypto/SwishCrypto'
import { OHPKM } from '../../pkm/OHPKM'
import { PathData } from '../path'
import { Box, BoxCoordinates, SAV } from '../SAV'
import { BoxNamesBlock } from './BoxNamesBlock'

export abstract class G8SAV<P extends PK8 | PB8 | PA8> implements SAV<P> {
  origin: GameOfOrigin = 0
  isPlugin = false

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

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
    const dataBeforeHash = bytes.slice(0, -SwishCrypto.SIZE_HASH)
    const dataAfterXor = SwishCrypto.cryptStaticXorpadBytes(dataBeforeHash)
    this.scBlocks = SwishCrypto.readBlocks(dataAfterXor)

    const boxNamesBlock = new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))

    const currentPCBlock = this.getBlockMust<SCValueBlock>('CurrentBox', 'value')
    this.currentPCBox = new DataView(currentPCBlock.raw).getUint8(0) + 1

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
          const mon = this.buildPKM(monData, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  abstract buildPKM(bytes: ArrayBuffer, encrypted: boolean): P

  abstract getMonBoxSizeBytes(): number
  abstract getBoxSizeBytes(): number

  abstract getBlockMust<T extends SCBlock = SCBlock>(
    blockName: G8BlockName,
    type?: T['blockType']
  ): T

  abstract prepareBoxesAndGetModified(): OHPKM[]

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  abstract getCurrentBox(): Box<P>

  abstract getGameName(): string

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Sun:
        return '#F1912B'
      case GameOfOrigin.Moon:
        return '#5599CA'
      case GameOfOrigin.UltraSun:
        return '#E95B2B'
      case GameOfOrigin.UltraMoon:
        return '#226DB5'
      default:
        return '#666666'
    }
  }

  getPluginIdentifier() {
    return undefined
  }
}

export type G8BlockName = 'BoxLayout' | 'Box' | 'CurrentBox'
