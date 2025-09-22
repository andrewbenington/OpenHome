import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { SM_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/wasm/PK7'
import * as PkmRs from '../../../pkm_rs/pkg'
import { isRestricted } from '../TransferRestrictions'
import { PathData } from './path'
import { Box, BoxCoordinates, SAV } from './SAV'

const PC_OFFSET = 0x04e00
const METADATA_OFFSET = 0x6be00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04800
const SAVE_SIZE_BYTES = 0x6be00

export class SMSAV_WASM implements SAV<Pk7Rust> {
  static pkmType = Pk7Rust
  static saveTypeAbbreviation = 'SM/USUM WASM'
  static saveTypeID = 'G7SAV WASM'

  inner: PkmRs.SunMoonSave

  origin: GameOfOrigin = 0
  isPlugin = false

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
    this.inner = PkmRs.SunMoonSave.fromBytes(bytes)
    this.currentPCBox = this.inner.current_pc_box_idx()
    this.origin = this.inner.game_of_origin()?.index ?? 0
    this.filePath = path
    this.boxes = Array(PkmRs.SunMoonSave.box_count())
    for (let box = 0; box < PkmRs.SunMoonSave.box_count(); box++) {
      const boxName = `Box ${box + 1}`

      this.boxes[box] = new Box(boxName, PkmRs.SunMoonSave.box_size())
    }

    for (let box = 0; box < PkmRs.SunMoonSave.box_count(); box++) {
      for (let monIndex = 0; monIndex < PkmRs.SunMoonSave.box_size(); monIndex++) {
        try {
          try {
            const mon = this.inner.get_mon_at(box, monIndex)

            if (mon.game_of_origin.index !== 0 && mon.species_and_forme.national_dex !== 0) {
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

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(SM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName: string = 'Pokémon Sun/Moon WASM'

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.Sun || origin === GameOfOrigin.Moon
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

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Sun:
        return '#F1912B'
      case GameOfOrigin.Moon:
        return '#5599CA'
      case GameOfOrigin.UltraSun:
        return '#E95B2B'
      case GameOfOrigin.UltraMoon:
        return '#226DB5'
      default:
        return '#666666'
    }
  }

  prepareBoxesAndGetModified() {
    return []
  }
}
