export interface TransferRestrictions {
  // games up to USUM include all up to one number
  maxDexNum?: number;
  // games LGPE and on have noncontiguous dex numbers transferable
  transferableDexNums?: number[];
  // e.g. Alolan forms in BDSP
  excludedForms?: FormRestrictions;
}

interface FormRestrictions {
  [dexNum: number]: number[] | undefined;
}

export const AlolanForms: FormRestrictions = {
  19: [1],
  20: [1],
  27: [1],
  28: [1],
  37: [1],
  38: [1],
  50: [1],
  51: [1],
  52: [1],
  53: [1],
  74: [1],
  75: [1],
  76: [1],
  88: [1],
  89: [1],
  103: [1],
  105: [1],
};
export const GalarianForms: FormRestrictions = {
  52: [2],
  77: [1],
  78: [1],
  79: [1],
  80: [1],
  83: [1],
  110: [1],
  122: [1],
  144: [1],
  145: [1],
  146: [1],
  199: [1],
  222: [1],
  263: [1],
  264: [1],
  554: [1],
  555: [1],
  562: [1],
  618: [1],
};

export const HisuianForms: FormRestrictions = {
  58: [1],
  59: [1],
  100: [1],
  101: [1],
  157: [1],
  211: [1],
  215: [1],
  503: [1],
  549: [1],
  550: [2],
  570: [1],
  571: [1],
  628: [1],
  705: [1],
  706: [1],
  713: [1],
  721: [1],
};

export const PaldeanForms: FormRestrictions = {
  128: [1, 2, 3],
  194: [1],
};

export const TransferLockedForms: FormRestrictions = {
  25: [8],
  133: [1],
  646: [1, 2],
  800: [1, 2],
  898: [1, 2],
};

export const LegendsArceusExcludedForms: FormRestrictions = {
  ...AlolanForms,
  ...GalarianForms,
  37: undefined,
  38: undefined,
  58: [0],
  59: [0],
  100: [0],
  101: [0],
  157: [0],
  211: [0],
  215: undefined,
  503: [0],
  549: [0],
  550: [0, 1],
  570: [0],
  571: [0],
  628: [0],
  705: [0],
  706: [0],
  713: [0],
  721: [0],
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
  52: [1, 2],
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
