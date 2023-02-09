import { GameOfOrigin } from "../consts/GameOfOrigin";
import { MONS_LIST } from "../consts/Mons";
import { pkm } from "../pkm/pkm";
import {
  getPokemonDBSprite,
  getSerebiiSprite,
  getShowdownSprite,
  getUnownSprite,
} from "./PokemonSprite";

const bytesToNumberLittleEndian = (bytes: Uint8Array) => {
  return bytesToNumberBigEndian(bytes.reverse());
};

const bytesToNumberBigEndian = (bytes: Uint8Array) => {
  let value = 0;
  bytes.forEach((byte) => {
    value *= 256;
    value += byte;
  });
  return value;
};

export const bytesToUint16LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 2));
};

export const bytesToUint32LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 4));
};

export const bytesToUint16BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 2));
};

export const bytesToUint24BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 3));
};

export const bytesToUint32BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 4));
};

export const uint16ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([value & 0xff, (value >> 8) & 0xff]);
};

export const uint32ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff,
  ]);
};

export const writeUint32ToBuffer = (
  value: number,
  buffer: Uint8Array,
  offset: number
) => {
  buffer.set(uint32ToBytesLittleEndian(value), offset);
};

export const writeUint16ToBuffer = (
  value: number,
  buffer: Uint8Array,
  offset: number
) => {
  buffer.set(uint16ToBytesLittleEndian(value), offset);
};

export const setFlag = (buffer: Uint8Array, offset: number, index: number, value: boolean) => {
  let byteIndex = offset + Math.floor(index / 8);
  let bitIndex = index % 8;
  if (byteIndex < buffer.length) {
    buffer[byteIndex] =
      (buffer[byteIndex] & ~Math.pow(2, bitIndex)) |
      (value ? Math.pow(2, bitIndex) : 0);
  }
};

export const getFlag = (buffer: Uint8Array, offset: number, index: number) => {
  let byteIndex = offset + Math.floor(index / 8);
  let bitIndex = index % 8;
  if (byteIndex < buffer.length) {
    return !!((buffer[byteIndex] >> bitIndex) & 0x1);
  }
  return false
};
