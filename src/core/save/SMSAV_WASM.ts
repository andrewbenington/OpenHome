import { OriginGame, SunMoonSave } from '@pkm-rs/pkg'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/wasm/PK7'
import { Item } from '../../../packages/pokemon-resources/src/consts/Items'
import { SM_TRANSFER_RESTRICTIONS } from '../../../packages/pokemon-resources/src/consts/TransferRestrictions'
import { Box, BoxCoordinates, OfficialSAV } from './interfaces'
import { PathData } from './util/path'
import { isRestricted } from './util/TransferRestrictions'

const SAVE_SIZE_BYTES = 0x6be00

export class SMSAV_WASM extends OfficialSAV<Pk7Rust> {
  static pkmType = Pk7Rust
  static saveTypeAbbreviation = 'SM/USUM WASM'
  static saveTypeID = 'G7SAV WASM'

  inner: SunMoonSave

  origin: OriginGame = 0

  boxRows = 5
  boxColumns = 6

  currentPCBox: number

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money
  boxes: Array<Box<Pk7Rust>>

  bytes = new Uint8Array()
  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxCoordinates[] = []

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
          try {
            const mon = this.inner.get_mon_at(box, monIndex)

            if (mon.game_of_origin !== 0 && mon.species_and_forme.nationalDex !== 0) {
              this.boxes[box].pokemon[monIndex] = new Pk7Rust(mon)
            }
          } catch (e) {
            console.error(`Error loading mon in box ${box + 1}, slot ${monIndex + 1}:`, e)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
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
    return this.inner.trainer.trainer_gender
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(SM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  prepareBoxesAndGetModified() {
    return []
  }
}
