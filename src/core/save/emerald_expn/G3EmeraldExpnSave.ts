import { G3SAV } from '@openhome-core/save/G3SAV.ts'
import { ExtraFormIndex, ItemGen3, OriginGame } from '@pkm-rs/pkg'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex.ts'
import G3EmeraldExpnSave from '@openhome-core/save/emerald_expn/G3EmeraldExpnSave.ts'

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
    return G3SAV.saveFileIsThisFormat(save) && !PK3EmeraldExpn.nonEmeraldGameCodes.includes(save.primarySave.gameCode);
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

