import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { Option } from '@openhome-core/util/functional'
import { SaveRef } from '@openhome-core/util/types'
import {
  ConvertStrategy,
  ExtraFormIndex,
  Gender,
  getPluginColor,
  Language,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { filterUndefined } from '../util/sort'
import { LookupType, SAVClass } from './util'
import { PathData } from './util/path'

type SparseArray<T> = (T | undefined)[]
export class Box<P extends PKMInterface> {
  name: string | undefined
  boxSlots: SparseArray<P>

  constructor(name: string, boxSize: number) {
    this.name = name
    this.boxSlots = new Array(boxSize)
  }
}

export interface BoxAndSlot {
  box: number
  boxSlot: number
}

export type SlotMetadata =
  | { isDisabled: true; disabledReason: string }
  | { isDisabled: false; disabledReason?: undefined }

export type SAV<P extends PKMInterface = PKMInterface> = OfficialSAV<P> | PluginSAV<P>

export type SaveWriter = {
  bytes: Uint8Array
  filepath: string
}

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
  // boxes: Array<Box<P>>
  getBoxCount(): number

  invalid: boolean
  tooEarlyToOpen: boolean

  updatedBoxSlots: BoxAndSlot[]

  isPlugin: boolean

  getCurrentBox: () => Box<P>
  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata
  getMonAt(boxNum: number, boxSlot: number): Option<P>
  setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void
  getAllMons(): Readonly<P>[]

  supportsMon: (dexNumber: number, formeNumber: number) => boolean
  supportsItem: (itemIndex: number) => boolean

  prepareWriter: () => SaveWriter

  getDisplayData(): Record<string, string | number | undefined> | undefined
  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): P
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
  abstract trainerGender: Gender
  abstract language?: Language // TODO: add to save files
  abstract displayID: string
  abstract currentPCBox: number
  abstract boxes: Readonly<Box<P>>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxAndSlot[]
  abstract supportsMon(dexNumber: number, formeNumber: number): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract prepareForSaving(): void
  abstract convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): P

  prepareWriter(): SaveWriter {
    this.prepareForSaving()
    return {
      bytes: new Uint8Array(this.bytes),
      filepath: this.filePath.raw,
    }
  }

  getDisplayData(): Record<string, string | number | undefined> | undefined {
    return {
      'Trainer Name': this.name,
      'Trainer ID': this.displayID,
      'Secret ID': this.sid,
    }
  }

  isPlugin: false = false
  pluginIdentifier: undefined = undefined

  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata = undefined

  abstract getMonAt(boxNum: number, boxSlot: number): Option<P>
  abstract setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void

  getBoxCount(): number {
    return this.boxes.length
  }

  getAllMons(): Readonly<P>[] {
    return this.boxes.flatMap((box) => box.boxSlots.filter(filterUndefined))
  }
  // getMonAt(boxNum: number, boxSlot: number): Option<P> {
  //   const box = this.boxes[boxNum]
  //   if (!box) return undefined
  //   return box.boxSlots[boxSlot]
  // }
  // setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void {
  //   const box = this.boxes[boxNum]
  //   if (!box) return
  //   box.boxSlots[boxSlot] = mon
  // }

  get gameName(): string {
    return OriginGames.gameName(this.origin)
  }

  get gameColor(): string {
    return OriginGames.color(this.origin)
  }

  get gameLogoPath(): string | undefined {
    return OriginGames.logoPath(this.origin)
  }

  get identifier(): SaveIdentifier {
    return saveToStringIdentifier(this)
  }

  get lookupType(): Option<LookupType> {
    return (this.constructor as SAVClass).lookupType
  }

  get boxSlotCount(): number {
    return this.boxRows * this.boxColumns
  }

  getBoxMonCount(boxNum: number): number {
    const box = this.boxes[boxNum]
    if (!box) return 0
    return box.boxSlots.filter(filterUndefined).length
  }

  getFirstNonEmptySlotAfter(boxNum: number, boxSlot: number): number | undefined {
    const box = this.boxes[boxNum]
    if (!box) return undefined
    for (let i = boxSlot + 1; i < box.boxSlots.length; i++) {
      if (box.boxSlots[i] !== undefined) {
        return i
      }
    }
    return undefined
  }

  getCurrentBox(): Readonly<Box<P>> {
    return this.boxes[this.currentPCBox]
  }

  getBoxName(boxNum: number): string | undefined {
    return this.boxes[boxNum]?.name
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
  abstract trainerGender: Gender
  abstract language?: Language // TODO: add to save files
  abstract displayID: string
  abstract currentPCBox: number
  abstract boxes: Readonly<Box<P>>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxAndSlot[]
  abstract supportsMon(
    dexNumber: number,
    formeNumber: number,
    extraFormIndex?: ExtraFormIndex
  ): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined
  abstract prepareForSaving(): void
  abstract convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): P

  prepareWriter(): SaveWriter {
    this.prepareForSaving()
    return {
      bytes: new Uint8Array(this.bytes),
      filepath: this.filePath.raw,
    }
  }

  getDisplayData(): Record<string, string | number | undefined> | undefined {
    return {
      'Trainer Name': this.name,
      'Trainer ID': this.displayID,
      Plugin: this.pluginIdentifier,
    }
  }

  isPlugin = true

  abstract pluginIdentifier: PluginIdentifier

  get gameName(): string {
    return pluginGameName(this.pluginIdentifier)
  }

  get gameColor(): string {
    return getPluginColor(this.pluginIdentifier)
  }

  get gameLogoPath(): string {
    return `logos/${this.pluginIdentifier}.png`
  }

  get identifier(): SaveIdentifier {
    return saveToStringIdentifier(this)
  }

  get lookupType(): Option<LookupType> {
    return (this.constructor as SAVClass).lookupType
  }

  abstract getMonAt(boxNum: number, boxSlot: number): Option<P>
  abstract setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void

  getBoxCount(): number {
    return this.boxes.length
  }

  getAllMons(): Readonly<P>[] {
    return this.boxes.flatMap((box) => box.boxSlots.filter(filterUndefined))
  }

  getBoxName(boxNum: number): string | undefined {
    return this.boxes[boxNum]?.name
  }

  getBoxMonCount(boxNum: number): number {
    const box = this.boxes[boxNum]
    if (!box) return 0
    return box.boxSlots.filter(filterUndefined).length
  }

  getCurrentBox(): Readonly<Box<P>> {
    return this.boxes[this.currentPCBox]
  }

  get boxSlotCount(): number {
    return this.boxRows * this.boxColumns
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
export type PluginIdentifier = 'radical_red' | 'unbound' | 'luminescent_platinum'

export function pluginGameName(identifier: PluginIdentifier): string {
  switch (identifier) {
    case 'radical_red':
      return 'Radical Red'
    case 'unbound':
      return 'Unbound'
    case 'luminescent_platinum':
      return 'Luminescent Platinum'
    default:
      return 'Unknown Plugin'
  }
}

export function pluginOriginMarkPath(identifier: PluginIdentifier): string | undefined {
  switch (identifier) {
    case 'radical_red':
    case 'unbound':
      return '/icons/gba.png'
    case 'luminescent_platinum':
      return '/origin_marks/Bdsp.png'
    default:
      return undefined
  }
}
export const Delimiter = '$' as const

export type Delim = typeof Delimiter

type OfficialSaveIdentifier = `${OriginGame}${Delim}${number}${Delim}${number}`

type PluginSaveIdentifier = `${OriginGame}${Delim}${number}${Delim}${number}${Delim}${string}`

export type SaveIdentifier = OfficialSaveIdentifier | PluginSaveIdentifier

export function saveToStringIdentifier(save: SAV): SaveIdentifier {
  return save.pluginIdentifier
    ? `${save.origin}${Delimiter}${save.tid}${Delimiter}${save.sid ?? 0}${Delimiter}${save.pluginIdentifier}`
    : `${save.origin}${Delimiter}${save.tid}${Delimiter}${save.sid ?? 0}`
}

export interface WasmSaveInner<P> {
  gameOfOrigin: OriginGame
  language?: Language
  secretId: number
  trainerGender: number
  trainerId: number
  trainerName: string
  displayId: string
  currentPcBoxIdx: number
  prepareBytesForSaving(): Uint8Array

  getMonAt(box_num: number, offset: number): Option<P>
  setMonAt(box_num: number, offset: number, mon?: P | null): void
}

export abstract class WasmOfficialSave<P extends PKMInterface, WasmP> extends OfficialSAV<P> {
  inner: WasmSaveInner<WasmP>

  constructor(inner: WasmSaveInner<WasmP>) {
    super()
    this.inner = inner
  }

  get name() {
    return this.inner.trainerName
  }

  get tid() {
    return this.inner.trainerId
  }

  get sid() {
    return this.inner.secretId
  }

  get displayID() {
    return this.inner.displayId
  }

  get trainerGender() {
    return this.inner.trainerGender
  }

  getCurrentPCBox() {
    return this.inner.currentPcBoxIdx
  }

  get origin() {
    return this.inner.gameOfOrigin
  }

  get language() {
    return this.inner.language
  }

  abstract monFromWasm(wasmMon: WasmP): P

  getMonAt(boxNum: number, boxSlot: number): Option<P> {
    const wasmMon = this.inner.getMonAt(boxNum, boxSlot)
    return wasmMon ? this.monFromWasm(wasmMon) : undefined
  }

  prepareForSaving(): Uint8Array {
    return this.inner.prepareBytesForSaving()
  }
}
