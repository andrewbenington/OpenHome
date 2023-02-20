import { SaveType } from '../renderer/types/types';
import { MONS_LIST } from '../consts/Mons';
import Types from '../consts/Types';
import { bytesToString, writeUint32ToBuffer } from '../util/ByteLogic';
import { PK3 } from './PK3';
import { PK4 } from './PK4';
import { pk5 } from './pk5';
import { pkm, stats, statsPreSplit } from './pkm';
import { PK2 } from './PK2';
import OHPKM from './OHPKM';

export const writeIVsToBuffer = (
  ivs: stats,
  buffer: Uint8Array,
  offset: number,
  isEgg: boolean,
  isNicknamed: boolean
) => {
  let ivsValue = 0;
  ivsValue = (ivsValue + (isNicknamed ? 1 : 0)) << 1;
  ivsValue = (ivsValue + (isEgg ? 1 : 0)) << 5;
  ivsValue = (ivsValue + (ivs.spd & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.spa & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.spe & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.def & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.atk & 0x1f)) << 5;
  ivsValue = ivsValue + (ivs.hp & 0x1f);
  writeUint32ToBuffer(ivsValue, buffer, offset);
};

export const getAbilityFromNumber = (
  dexNum: number,
  formNum: number,
  abilityNum: number
) => {
  if (!MONS_LIST[dexNum]?.formes[formNum]) {
    return 'None';
  }
  if (abilityNum === 4) {
    return (
      MONS_LIST[dexNum].formes[formNum].abilityH ??
      MONS_LIST[dexNum].formes[formNum].ability1
    );
  } else if (abilityNum === 2) {
    return (
      MONS_LIST[dexNum].formes[formNum].ability2 ??
      MONS_LIST[dexNum].formes[formNum].ability1
    );
  } else {
    return MONS_LIST[dexNum].formes[formNum].ability1;
  }
};

export const generateTeraType = (dexNum: number, formNum: number) => {
  if (!MONS_LIST[dexNum]?.formes[formNum]) {
    return;
  }
  let types = MONS_LIST[dexNum].formes[formNum].types;
  if (!types) {
    return;
  }
  const typeIndex = Math.floor(Math.random() * types.length);
  return Types.indexOf(types[typeIndex]);
};

export const ivsFromDVs = (dvs: statsPreSplit) => {
  return {
    hp: dvs.hp * 2 + 1,
    atk: dvs.atk * 2 + 1,
    def: dvs.def * 2 + 1,
    spa: dvs.spc * 2 + 1,
    spd: dvs.spc * 2 + 1,
    spe: dvs.spe * 2 + 1,
  };
};

export const gvsFromIVs = (ivs: stats) => {
  return {
    hp: gvFromIV(ivs.hp),
    atk: gvFromIV(ivs.atk),
    def: gvFromIV(ivs.def),
    spa: gvFromIV(ivs.spa),
    spd: gvFromIV(ivs.spd),
    spe: gvFromIV(ivs.spe),
  };
};

export const dvsFromIVs = (ivs: stats, isShiny: boolean) => {
  console.log('dvsFromIVs');
  if (isShiny) {
    let atkDV = Math.ceil((ivs.atk - 1) / 2);
    if ((atkDV & 0b11) === 0b01) {
      atkDV += 1;
    } else if (atkDV % 4 === 0) {
      atkDV += 2;
    }
    let hpDV = (atkDV & 1) << 3;
    return {
      hp: hpDV,
      atk: atkDV,
      def: 10,
      spc: 10,
      spe: 10,
    };
  }
  return {
    hp: Math.ceil((ivs.hp - 1) / 2),
    atk: Math.ceil((ivs.atk - 1) / 2),
    def: Math.ceil((ivs.def - 1) / 2),
    spc: Math.ceil(((ivs.spa + ivs.spd) / 2 - 1) / 2),
    spe: Math.ceil((ivs.spe - 1) / 2),
  };
};

const gvFromIV = (iv: number) => {
  return iv < 20 ? 0 : iv < 26 ? 1 : iv < 31 ? 2 : 3;
};

export const generateIVs = () => {
  return {
    hp: Math.round(Math.random() * 31),
    atk: Math.round(Math.random() * 31),
    def: Math.round(Math.random() * 31),
    spa: Math.round(Math.random() * 31),
    spd: Math.round(Math.random() * 31),
    spe: Math.round(Math.random() * 31),
  };
};

export const generateDVs = (isShiny: boolean) => {
  if (isShiny) {
    let atkDV = Math.round(Math.random() * 15);
    if ((atkDV & 0b11) === 0b01) {
      atkDV += 1;
    } else if (atkDV % 4 === 0) {
      atkDV += 2;
    }
    let hpDV = (atkDV & 1) << 3;
    return {
      hp: hpDV,
      atk: atkDV,
      def: 10,
      spc: 10,
      spe: 10,
    };
  }
  return {
    hp: Math.round(Math.random() * 15),
    atk: Math.round(Math.random() * 15),
    def: Math.round(Math.random() * 15),
    spc: Math.round(Math.random() * 15),
    spe: Math.round(Math.random() * 15),
  };
};

export const generatePersonalityValue = () => {
  return Math.floor(Math.random() * Math.pow(2, 32));
};

export const convertPKMForSaveType = (
  saveType: SaveType,
  mon: pkm
): pkm | undefined => {
  switch (saveType) {
    // case (SaveType.DPPt, SaveType.HGSS):
    //   return new PK4(mon);
    case (SaveType.RS, SaveType.FRLG, SaveType.E):
      return new PK3(mon);
    // case SaveType.G5:
    //   return new pk5(mon);
  }
};

export const getMonFileIdentifier = (mon: pkm) => {
  if (mon.personalityValue) {
    const baseMon = getBaseMon(mon.dexNum, mon.formNum);
    if (baseMon) {
      return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
        mon.trainerID,
        2
      ).concat(bytesToString(mon.secretID, 2))}-${bytesToString(
        mon.personalityValue,
        4
      )}-${bytesToString(mon.gameOfOrigin, 1)}`;
    }
  }
};

export const getMonGen12Identifier = (mon: PK2 | OHPKM) => {
  let dvs = mon.dvs;
  if (dvs) {
    const baseMon = getBaseMon(mon.dexNum, mon.formNum);
    const TID =
      mon.isGameBoy || mon.personalityValue === undefined
        ? mon.trainerID
        : mon.personalityValue % 0xffff;
    if (baseMon) {
      return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
        TID,
        2
      )}-${mon.trainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(
        16
      )}-${dvs.spc.toString(16)}-${dvs.spe.toString(16)}`;
    }
  }
};

// recursively returns prevo
export const getBaseMon = (dexNum: number, forme: number) => {
  let mon = { dexNumber: dexNum, formeNumber: forme };
  let prevo = MONS_LIST[dexNum]?.formes[forme]?.prevo;
  while (prevo) {
    mon = prevo;
    prevo = MONS_LIST[mon.dexNumber]?.formes[mon.formeNumber]?.prevo;
  }
  return mon;
};

export const formatHasColorMarkings = (format: string) => {
  return (
    (format.charAt(0) === 'p' &&
      ['7', '8', '9'].includes(format.charAt(format.length - 1))) ||
    format === 'ohpkm'
  );
};
