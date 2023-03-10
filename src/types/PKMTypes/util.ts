import { max } from 'lodash';
import { MOVE_DATA, POKEMON_DATA } from '../../consts';
import Types from '../../consts/Types';
import { bytesToString, writeUint32ToBuffer } from '../../util/ByteLogic';
import { PKM, stats, statsPreSplit } from './PKM';

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
  ivsValue += ivs.hp & 0x1f;
  writeUint32ToBuffer(ivsValue, buffer, offset);
};

export const getAbilityFromNumber = (
  dexNum: number,
  formNum: number,
  abilityNum: number
) => {
  if (!POKEMON_DATA[dexNum]?.formes[formNum]) {
    return 'None';
  }
  if (abilityNum === 4) {
    return (
      POKEMON_DATA[dexNum].formes[formNum].abilityH ??
      POKEMON_DATA[dexNum].formes[formNum].ability1
    );
  } else if (abilityNum === 2) {
    return (
      POKEMON_DATA[dexNum].formes[formNum].ability2 ??
      POKEMON_DATA[dexNum].formes[formNum].ability1
    );
  } else {
    return POKEMON_DATA[dexNum].formes[formNum].ability1;
  }
};

export const generateTeraType = (dexNum: number, formNum: number) => {
  if (!POKEMON_DATA[dexNum]?.formes[formNum]) {
    return undefined;
  }
  const { types } = POKEMON_DATA[dexNum].formes[formNum];
  if (!types) {
    return undefined;
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

const gvFromIV = (iv: number) => {
  return iv < 20 ? 0 : iv < 26 ? 1 : iv < 31 ? 2 : 3;
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
  if (isShiny) {
    let atkDV = Math.ceil((ivs.atk - 1) / 2);
    if ((atkDV & 0b11) === 0b01) {
      atkDV += 1;
    } else if (atkDV % 4 === 0) {
      atkDV += 2;
    }
    const hpDV = (atkDV & 1) << 3;
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
    const hpDV = (atkDV & 1) << 3;
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
  return Math.floor(Math.random() * 2 ** 32);
};

// recursively returns prevo
export const getBaseMon = (dexNum: number, forme: number) => {
  let mon = { dexNumber: dexNum, formeNumber: forme };
  let prevo = POKEMON_DATA[dexNum]?.formes[forme]?.prevo;
  while (prevo) {
    mon = prevo;
    prevo = POKEMON_DATA[mon.dexNumber]?.formes[mon.formeNumber]?.prevo;
  }
  return mon;
};

export const formatHasColorMarkings = (format: string) => {
  return (
    (format.charAt(0) === 'p' &&
      ['7', '8', '9'].includes(format.charAt(format.length - 1))) ||
    format === 'OHPKM'
  );
};

export const getTypes = (mon: PKM) => {
  let types = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.types;
  if (mon.format === 'PK1' && (mon.dexNum === 81 || mon.dexNum === 82)) {
    types = ['Electric'];
  } else if (
    ['PK1', 'PK2', 'PK3', 'COLOPKM', 'XDPKM', 'PK4', 'PK5'].includes(mon.format)
  ) {
    if (types?.includes('Fairy')) {
      if (types.length === 1 || types.includes('Flying')) {
        types = types.map((type) => (type === 'Fairy' ? 'Normal' : type));
      } else if (types[0] === 'Fairy') {
        return [types[1]];
      } else {
        return [types[0]];
      }
    }
  }
  return types ?? [];
};

export const getMoveMaxPP = (moveIndex: number, format: string, ppUps = 0) => {
  const move = MOVE_DATA[moveIndex];
  if (!move) return undefined;
  let baseMaxPP;
  switch (format) {
    case 'PK1':
      baseMaxPP = move.pastGenPP?.G1 ?? move.pp;
      break;
    case 'PK2':
      baseMaxPP = move.pastGenPP?.G2 ?? move.pp;
      break;
    case 'PK3':
    case 'COLOPKM':
    case 'XDPKM':
      baseMaxPP = move.pastGenPP?.G3 ?? move.pp;
      break;
    case 'PK4':
      baseMaxPP = move.pastGenPP?.G4 ?? move.pp;
      break;
    case 'PK5':
      baseMaxPP = move.pastGenPP?.G5 ?? move.pp;
      break;
    case 'PK6':
      baseMaxPP = move.pastGenPP?.G6 ?? move.pp;
      break;
    case 'PK7':
      baseMaxPP = move.pastGenPP?.SMUSUM ?? move.pp;
      break;
    case 'PB7':
      baseMaxPP = move.pastGenPP?.LGPE ?? move.pp;
      break;
    case 'PK8':
    case 'PA8':
    case 'PB8':
      baseMaxPP = move.pastGenPP?.G8 ?? move.pp;
      break;
    case 'PK9':
      baseMaxPP = move.pp;
      break;
    default:
      baseMaxPP = move.pp;
      break;
  }
  if (baseMaxPP === 1) {
    return baseMaxPP;
  }
  // gameboy games add less pp for 40pp moves
  if ((format === 'PK1' || format === 'PK2') && baseMaxPP === 40) {
    return baseMaxPP + Math.floor(ppUps * 7);
  }
  return baseMaxPP + Math.floor(ppUps * (baseMaxPP / 5));
};

export const adjustMovePPBetweenFormats = (
  destFormatMon: PKM,
  sourceFormatMon: PKM
) => {
  return sourceFormatMon.moves.map((move, i) => {
    const otherMaxPP =
      getMoveMaxPP(
        move,
        sourceFormatMon.format,
        sourceFormatMon.movePPUps[i]
      ) ?? 0;
    const thisMaxPP =
      getMoveMaxPP(move, destFormatMon.format, sourceFormatMon.movePPUps[i]) ??
      0;
    const adjustedMovePP = sourceFormatMon.movePP[i] - (otherMaxPP - thisMaxPP);
    return max([adjustedMovePP, 0]) ?? 0;
  }) as [number, number, number, number];
};
