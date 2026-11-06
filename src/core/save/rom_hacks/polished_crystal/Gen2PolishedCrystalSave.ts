import {Gen89RegionalForms, isRestricted, TransferRestrictions} from "@openhome-core/save/util/TransferRestrictions.ts";
import {BoxAndSlot, PluginIdentifier, SlotMetadata, WasmPluginSave} from "@openhome-core/save/interfaces.ts";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {Errorable, Result} from "@openhome-core/util/functional.ts";
import {
  ConvertStrategy,
  ExtraFormIndex,
  Gen7AlolaSaveRust,
  OriginGame,
  Pk2PolishedCrystalWasm,
  Pk7Wasm
} from "@pkm-rs/pkg";
import {PathData} from "@openhome-core/tauri/spectaCommands.ts";
import PK2PolishedCrystal from "../../../pkm/rom_hacks/polished_crystal/PK2PolishedCrystal";
import Gen2PolishedCrystalSaveRust from "../../../save/rom_hacks/polished_crystal/Gen2PolishedCrystalSaveRust";
import PK7 from "../../../pkm/PK7.ts";
import {USUM_TRANSFER_RESTRICTIONS} from "@openhome-core/resources/consts/TransferRestrictions.ts";
import {Item} from "@openhome-core/resources/consts/Items.ts";
import {NationalDex} from "@openhome-core/resources/consts/NationalDex.ts";
import {LGE_STARTER, LGP_STARTER, ORIGIN, SPIKY_EAR, WORLD_CAP} from "@openhome-core/resources/consts/Forms.ts";



export class Gen2PolishedCrystalSave extends WasmPluginSave<Pk2PolishedCrystalWasm, PK2PolishedCrystal, Gen2PolishedCrystalSaveRust> {
  static saveTypeID = 'polished_crystal'
  private static POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS: TransferRestrictions;
  static transferRestrictions: TransferRestrictions = this.POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS
  WASM_SAVE_CLASS: Gen2PolishedCrystalRust;

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

  static saveTypeName: string = 'Pokémon Polished Crystal'

  static includesOrigin(origin: OriginGame) {
    return Gen2PolishedCrystalSaveRust.includesOrigin(origin)
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK7> {
    return PK2PolishedCrystal.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    return !isRestricted(POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS, nationalDex, formNumber, extraFormIndex)
  }

  supportsItem(itemIndex: number) {
    return __notImplemented()
  }

  monFromWasm(wasmMon: Pk7Wasm): PK7 {
    return PK2PolishedCrystal.fromWasm(wasmMon)
  }
}

