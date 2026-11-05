import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Item } from '@openhome-core/resources/consts/Items'
import {
  SV_TRANSFER_RESTRICTIONS_BASE,
  SV_TRANSFER_RESTRICTIONS_ID,
  SV_TRANSFER_RESTRICTIONS_TM,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { BoxAndSlot, SlotMetadata, WasmPluginSave } from '@openhome-core/save/interfaces'
import { PathData } from '@openhome-core/save/util/path'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Result } from '@openhome-core/util/functional'
import {
  ConvertStrategy,
  ExtraFormIndex,
  isCompassSave,
  OriginGame,
  Pk9Wasm,
  ScarletVioletSaveRust,
  SvVersion,
} from '@pkm-rs/pkg'
import PK9Compass from './PK9Compass'

const COMPASS_LEVELCAP_BLOCK = 0xcc806ed6

export type SV_SAVE_REVISION = 'Base Game' | 'Teal Mask' | 'Indigo Disk'

export class CompassSave extends WasmPluginSave<Pk9Wasm, PK9Compass, ScarletVioletSaveRust> {
  WASM_SAVE_CLASS = ScarletVioletSaveRust

  static boxSizeBytes = PK9Compass.getBoxSize() * 30
  static pkmType = PK9Compass
  static saveTypeAbbreviation = 'Compass'
  static saveTypeName = 'Pokémon Compass'
  static saveTypeID = 'CMPSAV'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Gen 8 money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  isPlugin = true as const
  pluginIdentifier = 'compass' as const

  constructor(path: PathData, bytes: Uint8Array) {
    super(ScarletVioletSaveRust.fromBytes(bytes))
    this.filePath = path
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK9Compass> {
    return PK9Compass.fromOhpkm(ohpkm, strategy)
  }

  monConstructor(buffer: ArrayBuffer, encrypted: boolean): PK9Compass {
    return PK9Compass.fromBytes(buffer, encrypted)
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    return Pk9Wasm.isEmptySlot(new Uint8Array(bytes))
  }

  monFromWasm(wasmMon: Pk9Wasm): PK9Compass {
    return PK9Compass.fromWasm(wasmMon)
  }

  supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    const revision = this.saveVersion
    switch (revision) {
      case 'Base Game':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_BASE, nationalDex, formNumber, extraFormIndex)
      case 'Teal Mask':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_TM, nationalDex, formNumber, extraFormIndex)
      case 'Indigo Disk':
        return !isRestricted(SV_TRANSFER_RESTRICTIONS_ID, nationalDex, formNumber, extraFormIndex)
    }
  }

  get transferRestrictions() {
    const revision = this.saveVersion
    switch (revision) {
      case 'Base Game':
        return SV_TRANSFER_RESTRICTIONS_BASE
      case 'Teal Mask':
        return SV_TRANSFER_RESTRICTIONS_TM
      case 'Indigo Disk':
        return SV_TRANSFER_RESTRICTIONS_ID
    }
  }

  static transferRestrictions = SV_TRANSFER_RESTRICTIONS_ID

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
    return rideLegend
      ? [{ mon: PK9Compass.fromWasm(rideLegend), description: 'Ride Legendary' }]
      : []
  }

  getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined

  static fileIsSave(bytes: Uint8Array): boolean {
    return isCompassSave(bytes, COMPASS_LEVELCAP_BLOCK)
  }

  static includesOrigin(origin: OriginGame) {
    return ScarletVioletSaveRust.includesOrigin(origin)
  }

  free() {
    this.inner.free()
  }

  static getPluginIdentifier() {
    return 'compass' as const
  }
}
