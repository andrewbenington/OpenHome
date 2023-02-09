import { writeUint32ToBuffer } from "../util/ByteLogic";
import { stats, statsPreSplit } from "./pkm";

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
  ivsValue = (ivsValue + (ivs.spe & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.spd & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.spa & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.def & 0x1f)) << 5;
  ivsValue = (ivsValue + (ivs.atk & 0x1f)) << 5;
  ivsValue = ivsValue + (ivs.hp & 0x1f);
  writeUint32ToBuffer(ivsValue, buffer, offset);
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
