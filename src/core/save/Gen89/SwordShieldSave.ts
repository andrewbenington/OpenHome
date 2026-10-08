import { PK8 } from '@openhome-core/pkm'
import { Item } from '@openhome-core/resources/consts/Items'
import {
  SWSH_TRANSFER_RESTRICTIONS_BASE,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  SWSH_TRANSFER_RESTRICTIONS_IOA,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Errorable } from '@openhome-core/util/functional'
import {
  Block,
  ConvertStrategy,
  ExtraFormIndex,
  OriginGame,
  Pk8Wasm,
  SwordShieldSaveRust,
  SwordShieldVersion,
} from '@pkm-rs/pkg'
import { OHPKM } from '../../pkm/OHPKM'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { BoxAndSlot, WasmOfficialSave } from '../interfaces'
import { PathData } from '../util/path'

const SAVE_SIZE_BYTES_MIN = 0x171500
const SAVE_SIZE_BYTES_MAX = 0x187800

export type SWSH_SAVE_REVISION = 'Base Game' | 'Isle Of Armor' | 'Crown Tundra'

export class SwordShieldSave extends WasmOfficialSave<Pk8Wasm, PK8, SwordShieldSaveRust> {
  WASM_SAVE_CLASS = SwordShieldSaveRust

  static boxSizeBytes = PK8.getBoxSize() * 30
  static pkmType = PK8
  static saveTypeAbbreviation = 'SwSh'
  static saveTypeName = 'Pokémon Sword/Shield'
  static saveTypeID = 'SwShSAV'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 8 money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  scBlocks: Block[]

  constructor(path: PathData, bytes: Uint8Array) {
    super(SwordShieldSaveRust.fromBytes(bytes))
    this.scBlocks = SwishCrypto.decrypt(bytes)
    this.filePath = path
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK8> {
    return PK8.fromOhpkm(ohpkm, strategy)
  }

  monConstructor(buffer: ArrayBuffer, encrypted: boolean): PK8 {
    return PK8.fromBytes(buffer, encrypted)
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    return Pk8Wasm.isEmptySlot(new Uint8Array(bytes))
  }

  monFromWasm(wasmMon: Pk8Wasm): PK8 {
    return PK8.fromWasm(wasmMon)
  }

  supportsMon(nationalDex: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    switch (this.saveVersion) {
      case 'Base Game':
        return !isRestricted(
          SWSH_TRANSFER_RESTRICTIONS_BASE,
          nationalDex,
          formeNumber,
          extraFormIndex
        )
      case 'Isle of Armor':
        return !isRestricted(
          SWSH_TRANSFER_RESTRICTIONS_IOA,
          nationalDex,
          formeNumber,
          extraFormIndex
        )
      case 'Crown Tundra':
        return !isRestricted(
          SWSH_TRANSFER_RESTRICTIONS_CT,
          nationalDex,
          formeNumber,
          extraFormIndex
        )
    }
  }

  supportsItem(itemIndex: number) {
    switch (this.saveVersion) {
      case 'Base Game':
        return itemIndex <= Item.DynamaxCrystalAql7235
      case 'Isle of Armor':
        return itemIndex <= Item.MarkCharm
      case 'Crown Tundra':
        return itemIndex <= Item.ReinsOfUnity_3
    }
  }

  get saveVersion(): SwordShieldVersion {
    // for hack in monSupport.test.ts that calls this from the class itself
    try {
      return this.inner.saveVersion
    } catch {
      return 'Base Game'
    }
  }

  getDisplayData() {
    const pokedexOwned = this.inner.getPokedexOwned()

    if (pokedexOwned === 0xffff) {
      return { Status: 'New Save File' }
    }

    return {
      'Save Version': this.saveVersion,
      ...this.inner.getDisplayData(),
    }
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES_MIN || bytes.length > SAVE_SIZE_BYTES_MAX) {
      return false
    }
    return SwishCrypto.getIsHashValid(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return origin === OriginGame.Sword || origin === OriginGame.Shield
  }
}
