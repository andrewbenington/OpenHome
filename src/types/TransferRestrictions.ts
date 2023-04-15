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

export const CapPikachus: FormRestrictions = {
  25: [1, 2, 3, 4, 5, 6, 7, 9],
};

export const AlolanForms: FormRestrictions = {
  19: [1],
  20: [1],
  26: [1],
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
  80: [2],
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
  555: [2, 3],
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
  724: [1],
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

export const LA_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  transferableDexNums: [
    25, 26, 35, 36, 37, 38, 41, 42, 46, 47, 54, 55, 58, 59, 63, 64, 65, 66, 67,
    68, 72, 73, 74, 75, 76, 77, 78, 81, 82, 92, 93, 94, 95, 100, 101, 108, 111,
    112, 113, 114, 122, 123, 125, 126, 129, 130, 133, 134, 135, 136, 137, 143,
    155, 156, 157, 169, 172, 173, 175, 176, 185, 190, 193, 196, 197, 198, 200,
    201, 207, 208, 211, 212, 214, 215, 216, 217, 220, 221, 223, 224, 226, 233,
    234, 239, 240, 242, 265, 266, 267, 268, 269, 280, 281, 282, 299, 339, 340,
    315, 355, 356, 358, 361, 362, 363, 364, 365, 387, 388, 389, 390, 391, 392,
    393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407,
    408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422,
    423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437,
    438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452,
    453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467,
    468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482,
    483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 501, 502, 503, 548,
    549, 550, 570, 571, 627, 628, 641, 642, 645, 700, 704, 705, 706, 712, 713,
    722, 723, 724, 899, 900, 901, 902, 903, 904, 905,
  ],
  excludedForms: LegendsArceusExcludedForms,
};
