import { GameOfOrigin } from 'pokemon-resources'
import { SM_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import Pk7Rust from '../../../packages/pokemon-files/src/pkm/wasm/PK7'
import * as PkmRs from '../../../pkm_rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { isRestricted } from '../TransferRestrictions'
import { PathData } from './path'
import { Box, BoxCoordinates, SAV, SlotMetadata } from './SAV'

const PC_OFFSET = 0x04e00
const METADATA_OFFSET = 0x6be00 - 0x200
const PC_CHECKSUM_OFFSET = METADATA_OFFSET + 0x14 + 14 * 8 + 6
const BOX_NAMES_OFFSET: number = 0x04800
const SAVE_SIZE_BYTES = 0x6be00

export class SMSAV_WASM implements SAV<Pk7Rust> {
  inner: PkmRs.SunMoonSave

  origin: GameOfOrigin = 0
  isPlugin = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 7 money

  constructor(path: PathData, bytes: Uint8Array) {
    this.inner = PkmRs.SunMoonSave.fromBytes(bytes)
    this.filePath = path
  }

  supportsMon(dexNumber: number, formeNumber: number): boolean {
    return !isRestricted(SM_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return bytes.length === SAVE_SIZE_BYTES
  }

  static saveTypeName: string = 'Pokémon Sun/Moon'
  static saveTypeID = 'SMSAV'

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
}
