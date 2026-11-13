import PK2PolishedCrystal from "@openhome-core/pkm/rom_hacks/polished_crystal/PK2PolishedCrystal.ts";
import {
  POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS,
} from "@openhome-core/resources/consts/TransferRestrictions.ts";
import {
  BoxAndSlot, PluginIdentifier, SlotMetadata,
  WasmOfficialSave,
  WasmPluginSave, WasmSaveClass, WasmSaveInner
} from "@openhome-core/save/interfaces.ts";

import Gen2PolishedCrystalSaveRust, {
  ConvertStrategy,
  ExtraFormIndex,
  Gen7AlolaSaveRust,
  OriginGame,
  Pk7Wasm
} from "@pkm-rs/pkg"
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {PathData} from "@openhome-core/save/util/path.ts";
import {Errorable, Result} from "@openhome-core/util/functional.ts";
import {isRestricted, TransferRestrictions} from "@openhome-core/save/util/TransferRestrictions.ts";
import {Item} from "@openhome-core/resources/consts/Items.ts";
import PK3UB from "@openhome-core/save/unbound/PK3UB.ts";

export class Gen2PolishedCrystalSave extends WasmPluginSave<PK2PolishedCrystalWasm, PK2PolishedCrystal,
  Gen2PolishedCrystalSaveWasm> {
  getSlotMetadata = (_boxNum: number, _boxSlot: number): SlotMetadata => {
    return { isDisabled: false }
  }

  pluginIdentifier: PluginIdentifier = 'polished_crystal';
  WASM_SAVE_CLASS = Gen2PolishedCrystalSaveWasm;

  transferRestrictions = POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS

  constructor(path: PathData, bytes: Uint8Array) {
    super(Gen7AlolaSaveRust.fromBytes(bytes))
    this.filePath = path
  }

  monFromWasm(wasmMon: PK2PolishedCrystalWasm): PK2PolishedCrystal {
    return PK2PolishedCrystal.fromWasm(wasmMon)
  }

  filePath: PathData;
  fileCreated?: Date | undefined;
  money: number = 0 // TODO: money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []




  supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    return !isRestricted(POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS, nationalDex, formNumber, extraFormIndex)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= Item.FairyMemory
  }  
  
  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK2PolishedCrystal> {
    return PK2PolishedCrystal.fromOhpkm(ohpkm, strategy)
  }


  public static saveTypeID = "polished_crystal"
  static pkmType = PK2PolishedCrystal

  static saveTypeName: string = "Pokémon Polished Crystal"
  static saveTypeAbbreviation: string = "polished_crystal"

  static getPluginIdentifier(): PluginIdentifier {
    return 'polished_crystal' as const
  }

  static includesOrigin(originGame: OriginGame) {
    return originGame == OriginGame.Crystal
  }

  static fileIsSave(bytes: Uint8Array): boolean {
    return Gen2PolishedCrystalSaveWasm.fileIsSave(bytes)
  }
}