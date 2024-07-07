import { AllPKMFields } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { TransferRestrictions } from '../../types/TransferRestrictions'
import { SaveRef, SaveType } from '../../types/types'
import { OHPKM } from '../pkm/OHPKM'
import { ParsedPath } from './path'

export class Box<P extends AllPKMFields> {
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

export class SAV<P extends AllPKMFields> {
  saveType: SaveType = SaveType.UNKNOWN

  origin: GameOfOrigin = 0

  boxRows: number = 5

  boxColumns: number = 6

  transferRestrictions: TransferRestrictions = {}

  filePath: ParsedPath

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

  tooEarlyToOpen: boolean = false

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

  constructor(path: ParsedPath, bytes: Uint8Array) {
    this.filePath = path
    this.bytes = bytes
  }
}
