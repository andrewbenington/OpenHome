import { LGE_STARTER, LGP_STARTER } from 'consts/Formes';
import { NDex } from 'consts/NationalDex';

interface FormRestrictions {
  [dexNum: number]: number[] | undefined;
}

export interface TransferRestrictions {
  // games up to USUM include all up to one number
  maxDexNum?: number;
  // games LGPE and on have noncontiguous dex numbers transferable
  transferableDexNums?: number[];
  // e.g. Alolan forms in BDSP
  excludedForms?: FormRestrictions;
}
export const CapPikachus: FormRestrictions = {
  [NDex.PIKACHU]: [1, 2, 3, 4, 5, 6, 7, 9],
};

export const AlolanForms: FormRestrictions = {
  [NDex.RATTATA]: [1],
  [NDex.RATICATE]: [1],
  [NDex.RAICHU]: [1],
  [NDex.SANDSHREW]: [1],
  [NDex.SANDSLASH]: [1],
  [NDex.VULPIX]: [1],
  [NDex.NINETALES]: [1],
  [NDex.DIGLETT]: [1],
  [NDex.DUGTRIO]: [1],
  [NDex.MEOWTH]: [1],
  [NDex.PERSIAN]: [1],
  [NDex.GEODUDE]: [1],
  [NDex.GRAVELER]: [1],
  [NDex.GOLEM]: [1],
  [NDex.GRIMER]: [1],
  [NDex.MUK]: [1],
  [NDex.EXEGGUTOR]: [1],
  [NDex.MAROWAK]: [1],
};

export const GalarianForms: FormRestrictions = {
  [NDex.MEOWTH]: [2],
  [NDex.PONYTA]: [1],
  [NDex.RAPIDASH]: [1],
  [NDex.SLOWBRO]: [1],
  [NDex.FARFETCHD]: [1],
  [NDex.WEEZING]: [1],
  [NDex.MR_MIME]: [1],
  [NDex.ARTICUNO]: [1],
  [NDex.ZAPDOS]: [1],
  [NDex.MOLTRES]: [1],
  [NDex.SLOWKING]: [2],
  [NDex.CORSOLA]: [1],
  [NDex.ZIGZAGOON]: [1],
  [NDex.LINOONE]: [1],
  [NDex.DARUMAKA]: [1],
  [NDex.DARMANITAN]: [2, 3],
  [NDex.YAMASK]: [1],
  [NDex.STUNFISK]: [1],
};

export const HisuianForms: FormRestrictions = {
  [NDex.GROWLITHE]: [1],
  [NDex.ARCANINE]: [1],
  [NDex.VOLTORB]: [1],
  [NDex.ELECTRODE]: [1],
  [NDex.TYPHLOSION]: [1],
  [NDex.QWILFISH]: [1],
  [NDex.SNEASEL]: [1],
  [NDex.SAMUROTT]: [1],
  [NDex.LILLIGANT]: [1],
  [NDex.BASCULIN]: [2],
  [NDex.ZORUA]: [1],
  [NDex.ZOROARK]: [1],
  [NDex.BRAVIARY]: [1],
  [NDex.SLIGGOO]: [1],
  [NDex.GOODRA]: [1],
  [NDex.AVALUGG]: [1],
  [NDex.DECIDUEYE]: [1],
};

export const PaldeanForms: FormRestrictions = {
  [NDex.TAUROS]: [1, 2, 3],
  [NDex.WOOPER]: [1],
};

export const TransferLockedForms: FormRestrictions = {
  [NDex.PIKACHU]: [LGP_STARTER],
  [NDex.EEVEE]: [LGE_STARTER],
  [NDex.KYUREM]: [1, 2],
  [NDex.NECROZMA]: [1, 2],
  [NDex.CALYREX]: [1, 2],
};

export const LegendsArceusExcludedForms: FormRestrictions = {
  ...AlolanForms,
  ...GalarianForms,
  [NDex.VULPIX]: undefined,
  [NDex.NINETALES]: undefined,
  [NDex.GROWLITHE]: [0],
  [NDex.ARCANINE]: [0],
  [NDex.VOLTORB]: [0],
  [NDex.ELECTRODE]: [0],
  [NDex.TYPHLOSION]: [0],
  [NDex.QWILFISH]: [0],
  [NDex.SNEASEL]: undefined,
  [NDex.SAMUROTT]: [0],
  [NDex.LILLIGANT]: [0],
  [NDex.BASCULIN]: [0, 1],
  [NDex.ZORUA]: [0],
  [NDex.ZOROARK]: [0],
  [NDex.BRAVIARY]: [0],
  [NDex.SLIGGOO]: [0],
  [NDex.GOODRA]: [0],
  [NDex.AVALUGG]: [0],
  [NDex.DECIDUEYE]: [0],
};

export const Gen89RegionalForms: FormRestrictions = {
  ...GalarianForms,
  ...HisuianForms,
  ...PaldeanForms,
};

export const RegionalForms: FormRestrictions = {
  ...Gen89RegionalForms,
  ...AlolanForms,
  // combine meowth form lists
  [NDex.MEOWTH]: [1, 2],
};

export const isRestricted = (
  restrictions: TransferRestrictions,
  dexNum: number,
  formNum: number
) => {
  const { maxDexNum, transferableDexNums, excludedForms } = restrictions;
  if (maxDexNum && dexNum > maxDexNum) {
    return true;
  }
  if (transferableDexNums && !transferableDexNums.includes(dexNum)) {
    return true;
  }
  if (
    excludedForms &&
    excludedForms[dexNum] &&
    excludedForms[dexNum]?.includes(formNum)
  ) {
    return true;
  }
  return false;
};
