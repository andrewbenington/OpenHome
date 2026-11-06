import {TransferRestrictions} from "@openhome-core/save/util/TransferRestrictions.ts";
import {BoxAndSlot, PluginIdentifier, SlotMetadata, WasmPluginSave} from "@openhome-core/save/interfaces.ts";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {Errorable} from "@openhome-core/util/functional.ts";
import {ConvertStrategy, Pk2PolishedCrystalWasm} from "@pkm-rs/pkg";
import {PathData} from "@openhome-core/tauri/spectaCommands.ts";
import PK2PolishedCrystal from "../../../pkm/rom_hacks/polished_crystal/PK2PolishedCrystal";


export class G2PolishedCrystalSAV extends WasmPluginSave<Pk2PolishedCrystalWasm, PK2PolishedCrystal, G2SaveRust> {
  static saveTypeID = 'polished_crystal'
  private static POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS: TransferRestrictions;
  static transferRestrictions: TransferRestrictions = this.POLISHED_CRYSTAL_TRANSFER_RESTRICTIONS
  WASM_SAVE_CLASS: WasmSaveClass<G2SaveRust>;

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK2PolishedCrystal> {
    return undefined;
  }

  fileCreated: Date | undefined;
  filePath: PathData;
  getSlotMetadata: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined;
  invalid: boolean;

  monFromWasm(wasmMon: Pk2PolishedCrystalWasm): PK2PolishedCrystal {
    return undefined;
  }

  money: number;
  pluginIdentifier: PluginIdentifier;

  supportsItem(itemIndex: number): boolean {
    return false;
  }

  supportsMon(nationalDex: number, formNumber: number): boolean {
    return false;
  }

  tooEarlyToOpen: boolean;
  transferRestrictions: TransferRestrictions;
  updatedBoxSlots: BoxAndSlot[];

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK2PolishedCrystal> {
    return undefined;
  }
}