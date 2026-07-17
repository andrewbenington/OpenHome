import PK7 from '@openhome-core/pkm/PK7'
import { Item } from '@openhome-core/resources/consts/Items'
import { USUM_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import {
  ConvertStrategy,
  ExtraFormIndex,
  Gen7AlolaSaveRust,
  OriginGame,
  Pk7Wasm,
} from '@pkm-rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { Errorable, Option } from '../util/functional'
import { BoxAndSlot, WasmOfficialSave } from './interfaces'
import { PathData } from './util/path'
import { isRestricted } from './util/TransferRestrictions'

export class Gen7AlolaSave extends WasmOfficialSave<PK7, Pk7Wasm, Gen7AlolaSaveRust> {
  static pkmType = PK7
  static saveTypeAbbreviation = 'SM/USUM'
  static saveTypeID = 'SM/USUM'

  MAX_BOX_COUNT: number = Gen7AlolaSaveRust.MAX_BOX_COUNT
  SLOTS_PER_BOX: number = Gen7AlolaSaveRust.SLOTS_PER_BOX

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  currentPCBox: number

  constructor(path: PathData, bytes: Uint8Array) {
    super(Gen7AlolaSaveRust.fromBytes(bytes))
    this.filePath = path
    this.currentPCBox = this.inner.currentPcBoxIdx
  }

  get bytes() {
    return this.inner.prepareBytesForSaving()
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return Gen7AlolaSaveRust.fileIsSave(bytes)
  }

  static saveTypeName: string = 'Pokémon Sun/Moon/Ultra Sun/Ultra Moon'

  static includesOrigin(origin: OriginGame) {
    return Gen7AlolaSaveRust.includesOrigin(origin)
  }

  get boxRows() {
    return Gen7AlolaSaveRust.BOX_ROWS
  }

  get boxColumns() {
    return Gen7AlolaSaveRust.BOX_COLS
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK7> {
    return PK7.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    return !isRestricted(USUM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber, extraFormIndex)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<PK7>): void {
    this.inner.setMonAt(boxNum, boxSlot, mon ? mon.inner : undefined)
  }

  monFromWasm(wasmMon: Pk7Wasm): PK7 {
    return PK7.fromWasm(wasmMon)
  }
}
