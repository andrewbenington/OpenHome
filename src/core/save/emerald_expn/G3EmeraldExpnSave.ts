import {PluginIdentifier} from "@openhome-core/tauri/spectaCommands";
import {TransferRestrictions} from "../util/TransferRestrictions";
import {PK3EmeraldExpn} from "./PK3EmeraldExpn";
import {
    ConvertStrategy,
    ExtraFormIndex,
    NationalDex,
    OriginGame
} from "@pkm-rs/pkg";
import {G3SAV} from "../G3SAV";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {
    EMERALD_EXPN_TRANSFER_RESTRICTIONS
} from "@openhome-core/save/emerald_expn/G3EmeraldExpnTransferRestrictions.ts";

// noinspection TypeScriptValidateTypes
export class G3EmeraldExpnSave extends G3SAV {
    // @ts-ignore
    money: number;

    static saveTypeAbbreviation = 'EMERALD_EXPN'
    static saveTypeName = 'Pokémon Emerald Expansion'
    static saveTypeID = 'emerald_expn' as const
    static pkmType = PK3EmeraldExpn
    static transferRestrictions: TransferRestrictions = EMERALD_EXPN_TRANSFER_RESTRICTIONS


    static cosplayPikachuForms = [
        ExtraFormIndex.PikachuRockStar,
        ExtraFormIndex.PikachuBelle,
        ExtraFormIndex.PikachuPopStar,
        ExtraFormIndex.PikachuPhD,
        ExtraFormIndex.PikachuLibre,
    ]

    pluginIdentifier: PluginIdentifier = "emerald_expn";


    override getSaveFileHasNoDataErrorMessage() {
        return "The provided Emerald Expansion save file has no data, " +
            "or has only its 3rd save file slot defined!";
    }

    SAVE_FILE_SIZE : number = 0xD900

    override getSaveFile1EndBytes = () => this.SAVE_FILE_SIZE;

    override getSaveFile2EndBytes = () => this.SAVE_FILE_SIZE + 0xe000;

    private static EMERALD_EXPN_IDENTIFIER = "RHHEXP";

    static identifierMatchesGame(save: G3SAV) {
        return save.bytes.slice(0, 6).toString() == this.EMERALD_EXPN_IDENTIFIER;
    }

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


    override supportsMon(
        nationalDex: number,
        _formeNumber: number,
        extraFormIndex?: ExtraFormIndex
    ): boolean {
        if (!G3EmeraldExpnSave.extraFormSupported(extraFormIndex)) {
            return false
        }

        return nationalDex >= NationalDex.Bulbasaur &&
            nationalDex <= NationalDex.Pecharunt
    }

    // @ts-ignore
    supportsItem(itemIndex: number) {
        __notImplemented();
    }

    convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy) {
        return PK3EmeraldExpn.fromOhpkm(ohpkm, strategy);
    }


    override calculateGetOrigin() {
        return OriginGame.Emerald;
    }



}


