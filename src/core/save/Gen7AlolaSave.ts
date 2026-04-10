import {
  ConvertStrategy,
  ExtraFormIndex,
  Gen7AlolaSaveRust,
  OriginGame,
  Pk7 as Pk7Wasm,
} from '@pkm-rs/pkg'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/PK7'
import { Item } from '../../../packages/pokemon-resources/src/consts/Items'
import { USUM_TRANSFER_RESTRICTIONS } from '../../../packages/pokemon-resources/src/consts/TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { Option } from '../util/functional'
import { Box, BoxAndSlot, WasmOfficialSave } from './interfaces'
import { PathData } from './util/path'
import { isRestricted } from './util/TransferRestrictions'

export class Gen7AlolaSave extends WasmOfficialSave<Pk7Rust, Pk7Wasm> {
  static pkmType = Pk7Rust
  static saveTypeAbbreviation = 'SM/USUM WASM'
  static saveTypeID = 'SM/USUM WASM'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money
  boxes: Array<Box<Pk7Rust>>

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  currentPCBox: number

  constructor(path: PathData, bytes: Uint8Array) {
    super(Gen7AlolaSaveRust.fromBytes(bytes))
    this.filePath = path
    this.currentPCBox = this.inner.currentPcBoxIdx
    this.boxes = Array(Gen7AlolaSaveRust.MAX_BOX_COUNT)
    for (let box = 0; box < Gen7AlolaSaveRust.MAX_BOX_COUNT; box++) {
      const boxName = `Box ${box + 1}`

      this.boxes[box] = new Box(boxName, Gen7AlolaSaveRust.SLOTS_PER_BOX)
    }
  }

  get bytes() {
    return this.inner.prepareBytesForSaving()
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return Gen7AlolaSaveRust.fileIsSave(bytes)
  }

  static saveTypeName: string = 'Pokémon Sun/Moon/Ultra Sun/Ultra Moon WASM'

  static includesOrigin(origin: OriginGame) {
    return Gen7AlolaSaveRust.includesOrigin(origin)
  }

  get boxRows() {
    return Gen7AlolaSaveRust.BOX_ROWS
  }

  get boxColumns() {
    return Gen7AlolaSaveRust.BOX_COLS
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Pk7Rust {
    return Pk7Rust.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return false
    return !isRestricted(USUM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<Pk7Rust>): void {
    this.inner.setMonAt(boxNum, boxSlot, mon ? mon.inner : undefined)
  }

  monFromWasm(wasmMon: Pk7Wasm): Pk7Rust {
    return Pk7Rust.fromWasm(wasmMon)
  }
}
