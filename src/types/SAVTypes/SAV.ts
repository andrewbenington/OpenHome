import { GameOfOrigin } from 'consts'
import { OHPKM } from 'types/PKMTypes/OHPKM'
import { TransferRestrictions } from 'types/TransferRestrictions'
import { SaveRef, SaveType } from 'types/types'
import { PKM } from '../PKMTypes/PKM'

export interface Box {
  name: string
  pokemon: Array<PKM | undefined>
}

export interface BoxCoordinates {
  box: number
  index: number
}

export class SAV {
  saveType: SaveType = SaveType.UNKNOWN

  origin: GameOfOrigin = 0

  pkmType: typeof PKM = OHPKM

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

  boxes: Array<Box> = []

  bytes: Uint8Array

  invalid: boolean = false

  convertPKM: (_: PKM) => PKM = (mon) => new OHPKM(mon)

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
