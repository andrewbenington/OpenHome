import {G3SAV} from '@openhome-core/save/G3SAV.ts'
import {ExtraFormIndex} from '@pkm-rs/pkg'
import {NationalDex} from '@openhome-core/resources/consts/NationalDex.ts'
import {PK3} from "@openhome-core/pkm";

// noinspection JSUnusedGlobalSymbols
export public class G3EmeraldExpnSave extends G3SAV {

    static nonEmeraldGameCodes = [0, 1];

    static cosplayPikachuForms = [
        ExtraFormIndex.PikachuRockStar,
        ExtraFormIndex.PikachuBelle,
        ExtraFormIndex.PikachuPopStar,
        ExtraFormIndex.PikachuPhD,
        ExtraFormIndex.PikachuLibre,
    ]

    static override saveFileIsThisFormat(save: G3SAV) {
        let isBaseEmerald = G3SAV.saveFileIsThisFormat(save) && !G3EmeraldExpnSave.nonEmeraldGameCodes.includes(save.primarySave.gameCode);
        if (!isBaseEmerald) {
            return false
        }

        return any(save.getAllMons(), (mon) => !save.supportsMon(mon)
                && mon.moves.any(move => !save.supportsMove(move)))
            && save.getAllItems().any((item) => !save.supportsItem(item.index));
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

    supportsItem(itemIndex: number) {
        return ItemGen3EmeraldExpn.fromModern(itemIndex) !== undefined
    }
}

