import { Item } from '@openhome-core/resources/consts/Items'
import { USUM_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import {
    ConvertStrategy,
    ExtraFormIndex,
    OriginGame,
    PK3EmeraldExpnWasm,
} from '@pkm-rs/pkg'
import {PK3EmeraldExpn} from "@openhome-core/save/emerald_expn/PK3EmeraldExpn.ts";
import {PathData} from "@openhome-core/save/util/path.ts";
import {BoxAndSlot} from "@openhome-core/save/interfaces.ts";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {isRestricted} from "@openhome-core/save/util/TransferRestrictions.ts";
import {
    EMERALD_EXPN_TRANSFER_RESTRICTIONS
} from "@openhome-core/save/emerald_expn/G3EmeraldExpnTransferRestrictions.ts";
import {Result} from "@openhome-core/util/functional.ts";

export class Gen3EmeraldExpnSaveRustBridge extends WasmPluginSave<Pk3EmeraldExpnWasm,
    PK3EmeraldExpn, Gen3EmeraldExpnSaveRust> {
    WASM_SAVE_CLASS = Gen3EmeraldExpnSaveRust

    static pkmType = PK3EmeraldExpn
    static saveTypeAbbreviation = 'EMERALD_EXPN'
    static saveTypeID = 'EMERALD_EXPN'

    filePath: PathData
    fileCreated?: Date

    money: number = 0 // TODO: Gen 3 money

    invalid = false
    tooEarlyToOpen = false

    updatedBoxSlots: BoxAndSlot[] = []

    constructor(path: PathData, bytes: Uint8Array) {
        super(Gen3EmeraldExpnSaveRust.fromBytes(bytes))
        this.filePath = path
    }

    static fileIsSave(bytes: Uint8Array): boolean {
        return Gen3EmeraldExpnSaveRust.fileIsSave(bytes)
    }

    static saveTypeName: string = 'Pokémon Emerald Expansion'

    static includesOrigin(origin: OriginGame) {
        return Gen3EmeraldExpnSaveRust.includesOrigin(origin)
    }

    convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PK3EmeraldExpn> {
        return PK3EmeraldExpn.fromOhpkm(ohpkm, strategy)
    }

    supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
        return !isRestricted(EMERALD_EXPN_TRANSFER_RESTRICTIONS, nationalDex, formNumber, extraFormIndex)
    }

    supportsItem(itemIndex: number) {
        __notImplemented();
    }

    monFromWasm(wasmMon: PK3EmeraldExpnWasm): PK3EmeraldExpn {
        return PK3EmeraldExpn.fromWasm(wasmMon)
    }
}
