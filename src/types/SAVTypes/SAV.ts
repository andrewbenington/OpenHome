import { GameOfOrigin } from 'pokemon-resources'
import { SaveRef } from '../../types/types'
import { PKMInterface } from '../interfaces'
import { OHPKM } from '../pkm/OHPKM'
import { ParsedPath } from './path'

export class Box<P extends PKMInterface> {
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

export interface SAV<P extends PKMInterface = PKMInterface> {
  origin: GameOfOrigin

  boxRows: number
  boxColumns: number

  filePath: ParsedPath
  fileCreated?: Date

  money: number
  name: string
  tid: number
  sid?: number
  displayID: string

  currentPCBox: number
  boxes: Array<Box<P>>

  bytes: Uint8Array

  invalid: boolean
  tooEarlyToOpen: boolean

  pcChecksumOffset?: number
  pcOffset?: number

  updatedBoxSlots: BoxCoordinates[]

  gameColor: () => string

  getCurrentBox: () => Box<P>
  supportsMon: (dexNumber: number, formeNumber: number) => boolean

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  prepareBoxesAndGetModified: () => OHPKM[]

  calculateChecksum?: () => number
}

export function getSaveRef(save: SAV): SaveRef {
  return {
    filePath: save.filePath,
    game: save.origin ? save.origin.toString() : undefined,
    trainerName: save.name ? save.name : undefined,
    trainerID: save.displayID,
    lastOpened: Date.now(),
  }
}
