import { GameOfOrigin } from 'pokemon-resources'
import { SaveRef } from '../../types/types'
import { PKMInterface } from '../interfaces'
import { OHPKM } from '../pkm/OHPKM'
import { PathData } from './path'

type SparseArray<T> = (T | undefined)[]
export class Box<P extends PKMInterface> {
  name: string | undefined
  pokemon: SparseArray<P | OHPKM>

  constructor(name: string, boxSize: number) {
    this.name = name
    this.pokemon = new Array(boxSize)
  }
}

export interface BoxCoordinates {
  box: number
  index: number
}

export type SlotMetadata =
  | { isDisabled: true; disabledReason: string }
  | { isDisabled: false; disabledReason?: undefined }

export interface SAV<P extends PKMInterface = PKMInterface> {
  origin: GameOfOrigin

  boxRows: number
  boxColumns: number

  filePath: PathData
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
  isPlugin: boolean
  getPluginIdentifier?: () => string | undefined

  getCurrentBox: () => Box<P>
  supportsMon: (dexNumber: number, formeNumber: number) => boolean
  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata

  prepareBoxesAndGetModified: () => OHPKM[]

  calculatePcChecksum?: () => number

  getGameName: () => string

  getDisplayData?: () => Record<string, string | number | undefined>

  cleanup?: () => void
}

export type PluginSAV<P extends PKMInterface = PKMInterface> = SAV<P> & {
  getPluginIdentifier: () => string
  isPlugin: true
}

export function getSaveRef(save: SAV): SaveRef {
  return {
    filePath: save.filePath,
    game: save.origin,
    trainerName: save.name ? save.name : null,
    trainerID: save.displayID,
    lastOpened: null,
    lastModified: null,
    pluginIdentifier: save.getPluginIdentifier?.() ?? null,
    valid: true,
  }
}
