import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { PluginIdentifier as RustPluginIdentifier } from '@openhome-core/tauri/spectaCommands'
import { Errorable, Option, R, range, Result } from '@openhome-core/util/functional'
import { SaveRef } from '@openhome-core/util/types'
import {
  BinaryGender,
  ConvertStrategy,
  ExtraFormIndex,
  Language,
  OriginGame,
  OriginGames,
} from '@pkm-rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { filterUndefined } from '../util/sort'
import { LookupType, SAVClass } from './util'
import { PathData } from './util/path'
import { TransferRestrictions } from './util/TransferRestrictions'

type SparseArray<T> = (T | undefined)[]
export class Box<P> {
  name: string | undefined
  boxSlots: SparseArray<P>

  constructor(name: string, boxSize: number) {
    this.name = name
    this.boxSlots = new Array(boxSize)
  }

  map<U>(f: (slotData: Option<P>) => U): Box<U> {
    const box = new Box<U>(this.name ?? '', this.boxSlots.length)
    box.boxSlots = this.boxSlots.map(f)
    return box
  }
}

export interface BoxAndSlot {
  box: number
  boxSlot: number
}

export type SlotMetadata =
  { isDisabled: true; disabledReason: string } | { isDisabled: false; disabledReason?: undefined }

export type SAV<P extends PKMInterface = PKMInterface> = OfficialSAV<P> | PluginSAV<P>

export type SaveWriter = {
  bytes: Uint8Array
  filepath: string
}
type DisplayPkm<P extends PKMInterface> = { mon?: P; description: string }

interface BaseSAV<P extends PKMInterface = PKMInterface> {
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

  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata
  getMonAt(boxNum: number, boxSlot: number): Option<P>
  tryGetMonAt(boxNum: number, boxSlot: number): Result<Option<P>>
  setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void
  getAllMons(): Readonly<P>[]
  getBoxMonCount(boxIndex: number): number
  getPcMonCount(): number

  supportsMon: (nationalDex: number, formeNumber: number) => boolean
  supportsItem: (itemIndex: number) => boolean

  prepareWriter: () => SaveWriter

  getDisplayData(): Record<string, string | number | undefined> | undefined
  getDisplayPkms(): DisplayPkm<P>[]
  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<P>

  free?: () => void
}

export abstract class OfficialSAV<P extends PKMInterface = PKMInterface> implements BaseSAV<P> {
  abstract readonly origin: OriginGame
  abstract readonly boxRows: number
  abstract readonly boxColumns: number
  abstract readonly filePath: PathData
  abstract readonly fileCreated?: Date | undefined
  abstract readonly money: number
  abstract readonly name: string
  abstract readonly tid: number
  abstract readonly sid?: number | undefined
  abstract readonly trainerGender: BinaryGender
  abstract readonly language?: Language // TODO: add to save files
  abstract readonly displayID: string
  abstract currentPCBox: number
  abstract readonly boxes: Readonly<Box<P>>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxAndSlot[]
  abstract supportsMon(nationalDex: number, formeNumber: number): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract prepareForSaving(): void
  abstract convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<P>

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

  getDisplayPkms(): DisplayPkm<P>[] {
    return []
  }

  isPlugin: false = false
  pluginIdentifier: undefined = undefined

  getSlotMetadata?: (boxNum: number, boxSlot: number) => SlotMetadata = undefined

  abstract getMonAt(boxNum: number, boxSlot: number): Option<P>
  tryGetMonAt(boxNum: number, boxSlot: number): Result<Option<P>> {
    return R.Ok(this.getMonAt(boxNum, boxSlot))
  }

  abstract setMonAt(boxNum: number, boxSlot: number, mon: Option<P>): void

  getBoxCount(): number {
    return this.boxes.length
  }

  getAllMons(): Readonly<P>[] {
    return this.boxes.flatMap((box) => box.boxSlots.filter(filterUndefined))
  }

  get gameNameFull(): string {
    return OriginGames.gameNameFull(this.origin)
  }

  get gameNameShort(): string {
    return OriginGames.gameNameShort(this.origin)
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

  getPcMonCount(): number {
    return this.getAllMons().length
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

  getBoxName(boxNum: number): string | undefined {
    return this.boxes[boxNum]?.name
  }

  free() {}
}

export abstract class PluginSAV<P extends PKMInterface = PKMInterface> implements BaseSAV<P> {
  abstract transferRestrictions: TransferRestrictions
  abstract origin: OriginGame
  abstract boxRows: number
  abstract boxColumns: number
  abstract filePath: PathData
  abstract fileCreated?: Date | undefined
  abstract money: number
  abstract name: string
  abstract tid: number
  abstract sid?: number | undefined
  abstract trainerGender: BinaryGender
  abstract language?: Language // TODO: add to save files
  abstract displayID: string
  abstract currentPCBox: number
  abstract boxes: Readonly<Box<P>>[]
  abstract bytes: Uint8Array<ArrayBufferLike>
  abstract invalid: boolean
  abstract tooEarlyToOpen: boolean
  abstract updatedBoxSlots: BoxAndSlot[]
  abstract supportsMon(
    nationalDex: number,
    formeNumber: number,
    extraFormIndex?: ExtraFormIndex
  ): boolean
  abstract supportsItem(itemIndex: number): boolean
  abstract getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined
  abstract prepareForSaving(): void
  abstract convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<P>

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

  getDisplayPkms(): DisplayPkm<P>[] {
    return []
  }

  isPlugin = true

  abstract pluginIdentifier: PluginIdentifier

  get gameNameFull(): string {
    return pluginGameName(this.pluginIdentifier)
  }

  get gameNameShort(): string {
    return pluginGameName(this.pluginIdentifier, 'short')
  }

  get gameColor(): string {
    return OriginGames.pluginColor(this.pluginIdentifier)
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
  tryGetMonAt(boxNum: number, boxSlot: number): Result<Option<P>> {
    return R.Ok(this.getMonAt(boxNum, boxSlot))
  }

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

  getPcMonCount(): number {
    return this.getAllMons().length
  }

  get boxSlotCount(): number {
    return this.boxRows * this.boxColumns
  }

  free() {}
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

export type PluginIdentifier = RustPluginIdentifier

export function pluginGameName(
  identifier: PluginIdentifier,
  type: 'full' | 'short' = 'full'
): string {
  switch (identifier) {
    case 'radical_red':
      return 'Radical Red'
    case 'unbound':
      return 'Unbound'
    case 'luminescent_platinum':
      return type === 'full' ? 'Luminescent Platinum' : 'Lumi. Platinum'
    case 'compass':
      return 'Compass'
    default:
      return 'Unknown Plugin'
  }
}

export function isPluginGame(id: OriginGame | PluginIdentifier): id is PluginIdentifier {
  return typeof id === 'string'
}

export function pluginOriginMarkPath(identifier: PluginIdentifier): string | undefined {
  switch (identifier) {
    case 'radical_red':
    case 'unbound':
      return '/origin_marks/GameBoyAdvance.png'
    case 'luminescent_platinum':
      return '/origin_marks/Bdsp.png'
    case 'compass':
      return '/origin_marks/Tera.png'
    default:
      return undefined
  }
}
const Delimiter = '$' as const

type Delim = typeof Delimiter

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
  getBoxMonCount(boxIndex: number): number
  getPcMonCount(): number

  getBoxName(box_num: number): string
}

type WasmPkmInterface<P> = PKMInterface & { inner: P }

type WasmSaveClass<S> = {
  fromBytes(bytes: Uint8Array): S

  readonly BOX_COLS: number
  readonly BOX_ROWS: number
  readonly SLOTS_PER_BOX: number
  readonly MAX_BOX_COUNT: number
}

export abstract class WasmOfficialSave<
  WasmP,
  P extends WasmPkmInterface<WasmP>,
  WasmSave extends WasmSaveInner<WasmP>,
> extends OfficialSAV<P> {
  inner: WasmSave
  boxes: Array<Box<P>> = []
  currentPCBox: number

  constructor(inner: WasmSave) {
    super()
    this.inner = inner
    this.currentPCBox = inner.currentPcBoxIdx
  }

  abstract WASM_SAVE_CLASS: WasmSaveClass<WasmSave>

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

  saveCurrentPcBox() {
    this.inner.currentPcBoxIdx = this.currentPCBox
  }

  get origin() {
    return this.inner.gameOfOrigin
  }

  get language() {
    return this.inner.language
  }

  get bytes() {
    return this.inner.prepareBytesForSaving()
  }

  abstract monFromWasm(wasmMon: WasmP): P

  get MAX_BOX_COUNT(): number {
    return this.WASM_SAVE_CLASS.MAX_BOX_COUNT
  }

  get SLOTS_PER_BOX(): number {
    return this.WASM_SAVE_CLASS.SLOTS_PER_BOX
  }

  get boxRows() {
    return this.WASM_SAVE_CLASS.BOX_ROWS
  }

  get boxColumns() {
    return this.WASM_SAVE_CLASS.BOX_COLS
  }

  getMonAt(boxNum: number, boxSlot: number): Option<P> {
    const wasmMon = this.inner.getMonAt(boxNum, boxSlot)
    return wasmMon ? this.monFromWasm(wasmMon) : undefined
  }

  tryGetMonAt(boxNum: number, boxSlot: number): Result<Option<P>> {
    const wasmMon = this.inner.getMonAt(boxNum, boxSlot)
    return R.Ok(wasmMon ? this.monFromWasm(wasmMon) : undefined)
  }

  setMonAt(boxIndex: number, boxSlot: number, mon: Option<P>): void {
    this.inner.setMonAt(boxIndex, boxSlot, mon?.inner)
  }

  getAllMons() {
    const boxCount = this.MAX_BOX_COUNT
    const slotCount = this.SLOTS_PER_BOX
    return range(boxCount)
      .flatMap((boxIndex) => range(slotCount).map((boxSlot) => ({ boxIndex, boxSlot })))
      .map(({ boxIndex, boxSlot }) => this.getMonAt(boxIndex, boxSlot))
      .filter(filterUndefined)
  }

  getBoxMonCount(boxIndex: number): number {
    return this.inner.getBoxMonCount(boxIndex)
  }
  getPcMonCount(): number {
    return this.inner.getPcMonCount()
  }

  prepareForSaving(): Uint8Array {
    return this.inner.prepareBytesForSaving()
  }

  getBoxCount(): number {
    return this.MAX_BOX_COUNT
  }

  get boxSlotCount(): number {
    return this.SLOTS_PER_BOX
  }

  getBoxName(boxIndex: number): string {
    return this.inner.getBoxName(boxIndex)
  }
}
