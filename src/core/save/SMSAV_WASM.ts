import { ConvertStrategy, ExtraFormIndex, OriginGame, SunMoonSave } from '@pkm-rs/pkg'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/PK7'
import { Item } from '../../../packages/pokemon-resources/src/consts/Items'
import { SM_TRANSFER_RESTRICTIONS } from '../../../packages/pokemon-resources/src/consts/TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { Option } from '../util/functional'
import { Box, BoxAndSlot, OfficialSAV } from './interfaces'
import { PathData } from './util/path'
import { isRestricted } from './util/TransferRestrictions'

const SAVE_SIZE_BYTES = 0x6be00

export class SunMoonSaveWasm extends OfficialSAV<Pk7Rust> {
  static pkmType = Pk7Rust
  static saveTypeAbbreviation = 'SM/USUM WASM'
  static saveTypeID = 'SM/USUM WASM'

  inner: SunMoonSave

  origin: OriginGame = 0

  boxRows = 5
  boxColumns = 6

  currentPCBox: number

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money
  boxes: Array<Box<Pk7Rust>>

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.inner = SunMoonSave.fromBytes(bytes)
    this.currentPCBox = this.inner.current_pc_box_idx()
    this.origin = this.inner.game_of_origin()
    this.filePath = path
    this.boxes = Array(SunMoonSave.box_count())
    for (let box = 0; box < SunMoonSave.box_count(); box++) {
      const boxName = `Box ${box + 1}`

      this.boxes[box] = new Box(boxName, SunMoonSave.box_size())
    }

    for (let box = 0; box < SunMoonSave.box_count(); box++) {
      for (let monIndex = 0; monIndex < SunMoonSave.box_size(); monIndex++) {
        try {
          const mon = this.inner.getMonAt(box, monIndex)
          if (mon) {
            this.boxes[box].boxSlots[monIndex] = new Pk7Rust(mon, {})
          }
        } catch (e) {
          console.error(`Error loading mon in box ${box + 1}, slot ${monIndex + 1}:`, e)
        }
      }
    }
  }

  prepareForSaving() {
    this.inner.prepareBytesForSaving()
  }

  get bytes() {
    return this.inner.prepareBytesForSaving()
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName: string = 'Pokémon Sun/Moon WASM'

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Sun || origin === OriginGame.Moon
  }

  get name() {
    return this.inner.trainer.get_name_js()
  }

  get tid() {
    return this.inner.trainer.trainer_id
  }

  get sid() {
    return this.inner.trainer.secret_id
  }

  get displayID() {
    return this.inner.display_tid()
  }

  get trainerGender() {
    return this.inner.trainer.trainer_gender as number
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Pk7Rust {
    return Pk7Rust.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return false
    return !isRestricted(SM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getMonAt(boxNum: number, boxSlot: number): Option<Pk7Rust> {
    const rustMon = this.inner.getMonAt(boxNum, boxSlot)
    return rustMon ? new Pk7Rust(rustMon, {}) : undefined
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<Pk7Rust>): void {
    console.log(`Setting mon at box ${boxNum}, slot ${boxSlot} to`, mon)
    this.inner.setMonAt(boxNum, boxSlot, mon ? mon.inner : undefined)
  }
}
