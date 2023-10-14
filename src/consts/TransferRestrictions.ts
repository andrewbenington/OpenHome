import _ from 'lodash'
import {
  CapPikachus,
  Gen89RegionalForms,
  LegendsArceusExcludedForms,
  RegionalForms,
  TransferRestrictions,
} from 'types/TransferRestrictions'
import {
  COMPLETE,
  DAWN_WINGS,
  DUSK_MANE,
  EXCLAMATION,
  FAIRY,
  FAN,
  FROST,
  HEAT,
  MOW,
  ORIGIN,
  QUESTION,
  RESOLUTE,
  SKY,
  SPIKY_EAR,
  TEN_PCT,
  TEN_PCT_PC,
  THERIAN,
  ULTRA,
  UNBOUND,
  WASH,
} from './Formes'
import { NDex } from './NationalDex'

export const GEN1_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.MEW,
  excludedForms: { ...RegionalForms, ...CapPikachus },
}

export const GEN2_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.CELEBI,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.UNOWN]: [EXCLAMATION, QUESTION],
  },
}

export const GEN3_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.DEOXYS,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
  },
}

export const DP_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.ARCEUS,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.ROTOM]: [HEAT, WASH, FROST, FAN, MOW],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.GIRATINA]: [ORIGIN],
    [NDex.SHAYMIN]: [SKY],
    [NDex.ARCEUS]: [FAIRY],
  },
}

export const PT_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.ARCEUS,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ARCEUS]: [FAIRY],
  },
}

export const HGSS_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.ARCEUS,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ARCEUS]: [FAIRY],
  },
}

export const BW_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.GENESECT,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ARCEUS]: [FAIRY],
    [NDex.TORNADUS]: [THERIAN],
    [NDex.THUNDURUS]: [THERIAN],
    [NDex.LANDORUS]: [THERIAN],
    [NDex.KELDEO]: [RESOLUTE],
  },
}

export const BW2_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.GENESECT,
  excludedForms: {
    ...RegionalForms,
    ...CapPikachus,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ARCEUS]: [FAIRY],
  },
}

export const XY_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.VOLCANION,
  excludedForms: {
    ...RegionalForms,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ZYGARDE]: [TEN_PCT, TEN_PCT_PC, COMPLETE],
    [NDex.HOOPA]: [UNBOUND],
  },
}

export const ORAS_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.VOLCANION,
  excludedForms: {
    ...RegionalForms,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.ZYGARDE]: [TEN_PCT, TEN_PCT_PC, COMPLETE],
  },
}

export const SM_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.MARSHADOW,
  excludedForms: {
    ...Gen89RegionalForms,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
    [NDex.NECROZMA]: [DUSK_MANE, DAWN_WINGS, ULTRA],
  },
}

export const USUM_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  maxDexNum: NDex.ZERAORA,
  excludedForms: {
    ...Gen89RegionalForms,
    [NDex.PICHU]: [SPIKY_EAR],
    [NDex.DIALGA]: [ORIGIN],
    [NDex.PALKIA]: [ORIGIN],
  },
}

export const LGPE_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  transferableDexNums: [
    ..._.range(NDex.BULBASAUR, NDex.CHIKORITA),
    NDex.MELTAN,
    NDex.MELMETAL,
  ],
  excludedForms: Gen89RegionalForms,
}

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
}
