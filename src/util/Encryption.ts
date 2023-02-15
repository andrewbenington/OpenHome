import bigInt from 'big-integer';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from './ByteLogic';

const GEN3_BLOCKS_OFFSET = 0x20;
const GEN3_BLOCK_SIZE = 12;
const GEN45_BLOCKS_OFFSET = 0x08;
const GEN45_BLOCK_SIZE = 0x20;

const shuffleBlockOrders = [
  [0, 1, 2, 3],
  [0, 1, 3, 2],
  [0, 2, 1, 3],
  [0, 2, 3, 1],
  [0, 3, 1, 2],
  [0, 3, 2, 1],

  [1, 0, 2, 3],
  [1, 0, 3, 2],
  [1, 2, 0, 3],
  [1, 2, 3, 0],
  [1, 3, 0, 2],
  [1, 3, 2, 0],

  [2, 0, 1, 3],
  [2, 0, 3, 1],
  [2, 1, 0, 3],
  [2, 1, 3, 0],
  [2, 3, 0, 1],
  [2, 3, 1, 0],

  [3, 0, 1, 2],
  [3, 0, 2, 1],
  [3, 1, 0, 2],
  [3, 1, 2, 0],
  [3, 2, 0, 1],
  [3, 2, 1, 0],
];

const unshuffleBlockOrders = [
  [0, 1, 2, 3],
  [0, 1, 3, 2],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
  [0, 2, 3, 1],
  [0, 3, 2, 1],

  [1, 0, 2, 3],
  [1, 0, 3, 2],
  [2, 0, 1, 3],
  [3, 0, 1, 2],
  [2, 0, 3, 1],
  [3, 0, 2, 1],

  [1, 2, 0, 3],
  [1, 3, 0, 2],
  [2, 1, 0, 3],
  [3, 1, 0, 2],
  [2, 3, 0, 1],
  [3, 2, 0, 1],

  [1, 2, 3, 0],
  [1, 3, 2, 0],
  [2, 1, 3, 0],
  [3, 1, 2, 0],
  [2, 3, 1, 0],
  [3, 2, 1, 0],
];

export const unshuffleBlocks = (
  bytes: Uint8Array,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  let blockOrder = unshuffleBlockOrders[shiftValue];
  let growthBlock = bytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  );
  let attackBlock = bytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  );
  let statsBlock = bytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  );
  let miscBlock = bytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  );
  let unshuffledBytes = bytes;
  unshuffledBytes.set(growthBlock, startIndex);
  unshuffledBytes.set(attackBlock, startIndex + blockSize);
  unshuffledBytes.set(statsBlock, startIndex + 2 * blockSize);
  unshuffledBytes.set(miscBlock, startIndex + 3 * blockSize);
  return unshuffledBytes;
};

export const shuffleBlocks = (
  bytes: Uint8Array,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  let blockOrder = shuffleBlockOrders[shiftValue];
  let firstBlock = bytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  );
  let secondBlock = bytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  );
  let thirdBlock = bytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  );
  let fourthBlock = bytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  );
  let unshuffledBytes = bytes;
  unshuffledBytes.set(firstBlock, startIndex);
  unshuffledBytes.set(secondBlock, startIndex + blockSize);
  unshuffledBytes.set(thirdBlock, startIndex + 2 * blockSize);
  unshuffledBytes.set(fourthBlock, startIndex + 3 * blockSize);
  return unshuffledBytes;
};

export const shuffleBlocksGen3 = (bytes: Uint8Array) => {
  let personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
  let shiftValue = personalityValue % 24;
  return shuffleBlocks(bytes, shiftValue, GEN3_BLOCK_SIZE, GEN3_BLOCKS_OFFSET);
};

export const unshuffleBlocksGen3 = (bytes: Uint8Array) => {
  let personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
  let shiftValue = personalityValue % 24;
  return unshuffleBlocks(
    bytes,
    shiftValue,
    GEN3_BLOCK_SIZE,
    GEN3_BLOCKS_OFFSET
  );
};

export const decryptByteArrayGen3 = (bytes: Uint8Array) => {
  let unencryptedBytes = bytes;
  let encryptionKey =
    bytesToUint32LittleEndian(bytes, 0x00) ^
    bytesToUint32LittleEndian(bytes, 0x04);
  for (
    let i = GEN3_BLOCKS_OFFSET;
    i < GEN3_BLOCKS_OFFSET + 4 * GEN3_BLOCK_SIZE;
    i += 4
  ) {
    let value = bytesToUint32LittleEndian(unencryptedBytes, i);
    value = value ^ encryptionKey;
    unencryptedBytes.set(uint32ToBytesLittleEndian(value), i);
  }
  return unencryptedBytes;
};

export const unshuffleBlocksGen45 = (bytes: Uint8Array) => {
  let personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
  let shiftValue = ((personalityValue & 0x3e000) >> 0xd) % 24;
  return unshuffleBlocks(
    bytes,
    shiftValue,
    GEN45_BLOCK_SIZE,
    GEN45_BLOCKS_OFFSET
  );
};

export const decryptByteArrayGen45 = (bytes: Uint8Array) => {
  let checksum = bytesToUint16LittleEndian(bytes, 0x06);
  let unencryptedBytes = bytes;
  let seed = checksum;
  for (
    let i = GEN45_BLOCKS_OFFSET;
    i < GEN45_BLOCKS_OFFSET + 4 * GEN45_BLOCK_SIZE;
    i += 2
  ) {
    let bigIntSeed = bigInt(0x41c64e6d).times(seed).plus(0x6073);
    seed = bigIntSeed.and(0xffffffff).toJSNumber();
    let xorValue = (seed >> 16) & 0xffff;
    let unencryptedWord = bytesToUint16LittleEndian(bytes, i) ^ xorValue;
    let unencryptedWordBytes = uint16ToBytesLittleEndian(unencryptedWord);
    unencryptedBytes.set(unencryptedWordBytes, i);
  }
  return unencryptedBytes;
};
