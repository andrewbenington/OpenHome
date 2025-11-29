import { Gender, getPluginColor, OriginGame, OriginGames } from '@pkm-rs/pkg'
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

export type SAV<P extends PKMInterface = PKMInterface> = OfficialSAV<P> | PluginSAV<P>

export interface BaseSAV<P extends PKMInterface = PKMInterface> {
  origin: OriginGame

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

  updatedBoxSlots: BoxCoordinates[]

  isPlugin: boolean

  getCurrentBox: () => Box<P>
  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata

  supportsMon: (dexNumber: number, formeNumber: number) => boolean
  supportsItem: (itemIndex: number) => boolean

  prepareBoxesAndGetModified: () => OHPKM[]

  getDisplayData(): Record<string, string | number | undefined> | undefined
}

export abstract class OfficialSAV<P extends PKMInterface = PKMInterface> implements BaseSAV<P> {
  abstract origin: OriginGame
  abstract boxRows: number
  abstract boxColumns: number
  abstract filePath: PathData
  abstract fileCreated?: Date | undefined
  abstract money: number
  abstract name: string
  abstract tid: number
  abstract sid?: number | undefined
  abstract trainer_gender?: Gender
  abstract displayID: string
  abstract currentPCBox: number
  abstract boxes: Box<P>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxCoordinates[]
  abstract getCurrentBox(): Box<P>
  abstract supportsMon(dexNumber: number, formeNumber: number): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract prepareBoxesAndGetModified(): OHPKM[]

  getDisplayData(): Record<string, string | number | undefined> | undefined {
    return {
      'Trainer Name': this.name,
      'Trainer ID 2': this.displayID,
      'Secret ID': this.sid,
      HHHH: 'h',
    }
  }

  isPlugin: false = false

  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata = undefined

  get gameName(): string {
    return OriginGames.gameName(this.origin)
  }

  get gameColor(): string {
    return OriginGames.color(this.origin)
  }

  get gameLogoPath(): string | undefined {
    return OriginGames.logoPath(this.origin)
  }
}

export abstract class PluginSAV<P extends PKMInterface = PKMInterface> implements BaseSAV<P> {
  abstract origin: OriginGame
  abstract boxRows: number
  abstract boxColumns: number
  abstract filePath: PathData
  abstract fileCreated?: Date | undefined
  abstract money: number
  abstract name: string
  abstract tid: number
  abstract sid?: number | undefined
  abstract trainer_gender?: Gender
  abstract displayID: string
  abstract currentPCBox: number
  abstract boxes: Box<P>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxCoordinates[]
  abstract getCurrentBox(): Box<P>
  abstract supportsMon(dexNumber: number, formeNumber: number): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined
  abstract prepareBoxesAndGetModified(): OHPKM[]

  getDisplayData(): Record<string, string | number | undefined> | undefined {
    return {
      'Trainer Name': this.name,
      'Trainer ID': this.displayID,
      Plugin: this.pluginIdentifier,
    }
  }

  isPlugin = true

  abstract pluginIdentifier: string

  abstract get gameName(): string

  get gameColor(): string {
    return getPluginColor(this.pluginIdentifier)
  }

  get gameLogoPath(): string {
    return `logos/${this.pluginIdentifier}.png`
  }
}

export function getSaveRef(save: SAV): SaveRef {
  return {
    filePath: save.filePath,
    game: save.origin,
    trainerName: save.name ? save.name : null,
    trainerID: save.displayID,
    lastOpened: null,
    lastModified: null,
    pluginIdentifier: save.isPlugin ? save.pluginIdentifier : null,
    valid: true,
  }
}
