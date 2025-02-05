import { PA8, PB8, PK8 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { SCBlock } from '../../../util/SwishCrypto/SCBlock'
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

  money: number = 0
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 8 current box

  abstract boxes: Array<Box<P>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
  }

  abstract getBoxNamesBlock(): BoxNamesBlock

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
