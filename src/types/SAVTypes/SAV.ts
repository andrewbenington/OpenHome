import { GameOfOrigin } from 'pokemon-resources'
import { OHPKM } from '../../types/PKMTypes/OHPKM'
import { TransferRestrictions } from '../../types/TransferRestrictions'
import { SaveRef, SaveType } from '../../types/types'
import { PKM } from '../PKMTypes/PKM'

export class Box<P extends PKM> {
  name: string
  pokemon: Array<P | OHPKM | undefined>

  constructor(name: string, boxSize: number) {
    this.name = name
    this.pokemon = new Array(boxSize)
  }
}

export interface BoxCoordinates {
  box: number
  index: number
}

export class SAV<P extends PKM> {
  saveType: SaveType = SaveType.UNKNOWN

  origin: GameOfOrigin = 0

  boxRows: number = 5

  boxColumns: number = 6

  transferRestrictions: TransferRestrictions = {}

  filePath: string

  fileCreated?: Date

  money: number = 0

  name: string = ''

  tid: number = 0

  sid?: number

  displayID: string = '000000'

  currentPCBox: number = 0

  boxNames: string[] = []

  boxes: Array<Box<P>> = []

  bytes: Uint8Array

  invalid: boolean = false

  getSaveRef: () => SaveRef = () => {
    return {
      filePath: this.filePath,
      saveType: this.saveType,
      game: this.origin ? this.origin.toString() : undefined,
      trainerName: this.name ? this.name : undefined,
      trainerID: this.displayID,
      lastOpened: Date.now(),
    }
  }

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: string, bytes: Uint8Array) {
    this.filePath = path
    this.bytes = bytes
  }
}
