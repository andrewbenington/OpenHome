import { G3SAV } from '@openhome-core/save/G3SAV.ts'
import { ExtraFormIndex } from '@pkm-rs/pkg'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex.ts'
import {PK3} from "@openhome-core/pkm";

// noinspection JSUnusedGlobalSymbols
class PK3EmeraldExpn extends G3SAV {
  isPlugin: boolean = true

  static nonEmeraldGameCodes = [0, 1];

  static cosplayPikachuForms = [
    ExtraFormIndex.PikachuRockStar,
    ExtraFormIndex.PikachuBelle,
    ExtraFormIndex.PikachuPopStar,
    ExtraFormIndex.PikachuPhD,
    ExtraFormIndex.PikachuLibre,
  ]

  static override saveFileIsThisFormat(save: G3SAV) {
    let isBaseEmerald = G3SAV.saveFileIsThisFormat(save) && !PK3EmeraldExpn.nonEmeraldGameCodes.includes(save.primarySave.gameCode);
    if (!isBaseEmerald) {
      return false
    }

    return !save.getAllMons<PK3>().any((mon) => {
      mon.dexNum >= NationalDex.Deoxys || mon.moves.any((move) => move.)
    });
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
      (PK3EmeraldExpn.isPikachuCosplay(extraFormIndex) ||
        PK3EmeraldExpn.isGigantamax(extraFormIndex) ||
        extraFormIndex == ExtraFormIndex.EternatusEternamax)
    )
  }

  static isGigantamax(extraFormIndex: ExtraFormIndex) {
    return extraFormIndex >= ExtraFormIndex.CharizardGiga && extraFormIndex <= ExtraFormIndex.UrsifuRapidGiga;
  }

  static isPikachuCosplay(extraFormIndex: ExtraFormIndex) {
    return PK3EmeraldExpn.cosplayPikachuForms.includes(extraFormIndex)
  }

  supportsItem(itemIndex: number) {
    return ItemGen3EmeraldExpn.fromModern(itemIndex) !== undefined
  }
}

