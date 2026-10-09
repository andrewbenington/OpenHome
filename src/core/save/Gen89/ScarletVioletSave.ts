import { PK9 } from '@openhome-core/pkm'
import { Item } from '@openhome-core/resources/consts/Items'
import {
  SV_TRANSFER_RESTRICTIONS_BASE,
  SV_TRANSFER_RESTRICTIONS_ID,
  SV_TRANSFER_RESTRICTIONS_TM,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Result } from '@openhome-core/util/functional'
import {
  ConvertStrategy,
  ExtraFormIndex,
  OriginGame,
  Pk9Wasm,
  ScarletVioletSaveRust,
  SvVersion,
} from '@pkm-rs/pkg'
import { OHPKM } from '../../pkm/OHPKM'
import { BoxAndSlot, WasmOfficialSave } from '../interfaces'
import { PathData } from '../util/path'

export class ScarletVioletSave extends WasmOfficialSave<Pk9Wasm, PK9, ScarletVioletSaveRust> {
  WASM_SAVE_CLASS = ScarletVioletSaveRust

  static boxSizeBytes = PK9.getBoxSize() * 30
  static pkmType = PK9
  static saveTypeAbbreviation = 'SV'
  static saveTypeName = 'Pokémon Scarlet/Violet'
  static saveTypeID = 'SVSAV'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 8 money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(ScarletVioletSaveRust.fromBytes(bytes))
    this.filePath = path
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK9> {
    return PK9.fromOhpkm(ohpkm, strategy)
  }

  monConstructor(buffer: ArrayBuffer, encrypted: boolean): PK9 {
    return PK9.fromBytes(buffer, encrypted)
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    return Pk9Wasm.isEmptySlot(new Uint8Array(bytes))
  }

  monFromWasm(wasmMon: Pk9Wasm): PK9 {
    return PK9.fromWasm(wasmMon)
  }

  supportsMon(nationalDex: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    const revision = this.saveVersion
    switch (revision) {
      case 'Base Game':
        return !isRestricted(
          SV_TRANSFER_RESTRICTIONS_BASE,
          nationalDex,
          formeNumber,
          extraFormIndex
        )
      case 'Teal Mask':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_TM, nationalDex, formeNumber, extraFormIndex)
      case 'Indigo Disk':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_ID, nationalDex, formeNumber, extraFormIndex)
    }
  }

  supportsItem(itemIndex: number) {
    const revision = this.saveVersion
    switch (revision) {
      case 'Base Game':
        return itemIndex <= Item.YellowDish
      case 'Teal Mask':
        return itemIndex <= Item.GlimmeringCharm
      case 'Indigo Disk':
        return itemIndex <= Item.BriarsBook
    }
  }
  get saveVersion(): SvVersion {
    // for hack in monSupport.test.ts that calls this from the class's prototype
    try {
      return this.inner.saveVersion
    } catch {
      return 'Base Game'
    }
  }

  getDisplayData() {
    return { ...this.inner.getDisplayData() }
  }

  getDisplayPkms() {
    const rideLegend = this.inner.getRideLegend()
    return rideLegend ? [{ mon: PK9.fromWasm(rideLegend), description: 'Ride Legendary' }] : []
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return ScarletVioletSaveRust.fileIsSave(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return ScarletVioletSaveRust.includesOrigin(origin)
  }
}
