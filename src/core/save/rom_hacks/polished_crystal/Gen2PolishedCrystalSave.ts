import {isRestricted, TransferRestrictions} from "@openhome-core/save/util/TransferRestrictions.ts";
import {BoxAndSlot, SlotMetadata, WasmPluginSave} from "@openhome-core/save/interfaces.ts";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {Result} from "@openhome-core/util/functional.ts";
import {
  ConvertStrategy,
  ExtraFormIndex,
  OriginGame,
  Pk2PolishedCrystalWasm,
  Pk7Wasm
} from "@pkm-rs/pkg";
import {PathData} from "@openhome-core/tauri/spectaCommands.ts";
import PK2PolishedCrystal from "../../../pkm/rom_hacks/polished_crystal/PK2PolishedCrystal.ts";
import PK7 from "../../../pkm/PK7.ts";
import {
  POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS
} from "@openhome-core/resources/consts/TransferRestrictions.ts";


export class Gen2PolishedCrystalSave extends WasmPluginSave<Pk2PolishedCrystalWasm, PK2PolishedCrystal, Gen2PolishedCrystalSaveRust> {
  static saveTypeID = 'polished_crystal'
  static pkmType = PK2PolishedCrystal
  static saveTypeAbbreviation = 'polished_crystal'
  static saveTypeName: string = 'Pokémon Polished Crystal'
  transferRestrictions: TransferRestrictions = POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS
  getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined;
  WASM_SAVE_CLASS: Gen2PolishedCrystalSaveRust;
  pluginIdentifier = 'polished_crystal' as const
  filePath: PathData
  fileCreated?: Date
  money: number = 0 // TODO: Gen 2 money calculation
  invalid = false
  tooEarlyToOpen = false
  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(Gen2PolishedCrystalSaveRust.fromBytes(bytes))
    this.filePath = path
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return Gen2PolishedCrystalSaveRust.fileIsSave(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return Gen2PolishedCrystalSaveRust.includesOrigin(origin)
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK2PolishedCrystal> {
    return PK2PolishedCrystal.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    return !isRestricted(POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS, nationalDex, formNumber, extraFormIndex)
  }

  supportsItem(_itemIndex: number) {
    return false
  }

  monFromWasm(wasmMon: Pk2PolishedCrystalWasm): PK2PolishedCrystal {
    return PK2PolishedCrystal.fromWasm(wasmMon)
  }

  getPluginIdentifier() {
    return this.pluginIdentifier;
  }
}

