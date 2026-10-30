import {Box, BoxAndSlot, PluginSAV, SlotMetadata} from "../interfaces";
import {PluginIdentifier} from "@openhome-core/tauri/spectaCommands";
import {Option} from "@openhome-core/util/functional";
import {emptyPathData, PathData} from "../util/path";
import {TransferRestrictions} from "../util/TransferRestrictions";
import {PK3EmeraldExpn} from "./PK3EmeraldExpn";
import {Move} from "@openhome-core/resources";
import {
    BinaryGender,
    ExtraFormIndex,
    // ItemGen3EmeraldExpn,
    Language,
    NationalDex,
    OriginGame
} from "../../../../pkm_rs/pkg";
import {G3SAV} from "../G3SAV";

const MAX_ADDITIONAL_BYTES = 0x100;
const SAVE_SIZE_BYTES = 0x20000


// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class G3EmeraldExpnSave<T extends PK3EmeraldExpn> extends PluginSAV<T> {
    /**
     * Non-Emerald game codes, representing Ruby/Sapphire (0) and FireRed/LeafGreen (1).
     */
    static nonEmeraldGameCodes = [0, 1];
    static cosplayPikachuForms = [
        ExtraFormIndex.PikachuRockStar,
        ExtraFormIndex.PikachuBelle,
        ExtraFormIndex.PikachuPopStar,
        ExtraFormIndex.PikachuPhD,
        ExtraFormIndex.PikachuLibre,
    ]
    transferRestrictions: TransferRestrictions = __notImplemented();
    origin: OriginGame = __notImplemented();
    filePath: PathData = __notImplemented();
    fileCreated?: Date | undefined = __notImplemented();
    money: number = __notImplemented();
    name: string = __notImplemented();
    tid: number = __notImplemented();
    sid?: number | undefined = __notImplemented();
    trainerGender: BinaryGender = __notImplemented();
    language?: Language | undefined = __notImplemented();
    displayID: string = __notImplemented();
    currentPCBox: number = __notImplemented();
    invalid: boolean = __notImplemented();
    tooEarlyToOpen: boolean = __notImplemented();
    updatedBoxSlots: BoxAndSlot[] = __notImplemented();
    getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined = __notImplemented();
    pluginIdentifier: PluginIdentifier = __notImplemented();
    boxColumns: number = __notImplemented();
    boxRows: number = __notImplemented();
    boxes: Readonly<Box<T>>[] = __notImplemented();

    // @ts-ignore
    bytes: Uint8Array<ArrayBufferLike> = __notImplemented();


    // static fileIsSave(bytes: Uint8Array): boolean {
    //     if (bytes.length < SAVE_SIZE_BYTES || bytes.length - SAVE_SIZE_BYTES > MAX_ADDITIONAL_BYTES) {
    //         return false
    //     }
    //     try {
    //         const save = new G3SAV(emptyPathData, bytes)
    //         return save.bytes.slice(0, 6).toString() == "RHHEXP";
    //     } catch (e) {
    //         console.error(e)
    //         return false
    //     }
    // }



    static extraFormSupported(extraFormIndex?: ExtraFormIndex): boolean {
        return (
            extraFormIndex != null &&
            (G3EmeraldExpnSave.isPikachuCosplay(extraFormIndex) ||
                G3EmeraldExpnSave.isGigantamax(extraFormIndex) ||
                extraFormIndex == ExtraFormIndex.EternatusEternamax)
        )
    }

    static isGigantamax(extraFormIndex: ExtraFormIndex) {
        return extraFormIndex >= ExtraFormIndex.CharizardGiga && extraFormIndex <= ExtraFormIndex.UrsifuRapidGiga;
    }

    static isPikachuCosplay(extraFormIndex: ExtraFormIndex) {
        return G3EmeraldExpnSave.cosplayPikachuForms.includes(extraFormIndex)
    }

    // noinspection JSUnusedLocalSymbols
    // @ts-ignore
    private static any(allMons: any, param2: (mon) => AbortSignal) {
        return __notImplemented();
    }

    prepareForSaving(): void {
        throw __notImplemented();
    }

    // @ts-ignore
    getMonAt(boxNum: number, boxSlot: number): Option<T> {
        throw __notImplemented();
    }

    // @ts-ignore
    setMonAt(boxNum: number, boxSlot: number, mon: Option<T>): void {
        throw __notImplemented();
    }

    override supportsMon(
        nationalDex: number,
        formeNumber: number,
        extraFormIndex?: ExtraFormIndex
    ): boolean {
        if (!G3EmeraldExpnSave.extraFormSupported(extraFormIndex)) {
            return false
        }

        return nationalDex <= NationalDex.Pecharunt && (formeNumber === 0 || nationalDex === NationalDex.Unown)

    }

    // @ts-ignore
    supportsItem(itemIndex: number) {
        return __notImplemented();
    }

    // @ts-ignore
    convertOhpkm(ohpkm: OHPKM, strategy) {
        return __notImplemented();
    }


}

