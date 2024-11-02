import bigInt from 'big-integer'
import crypto from 'crypto'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from './ByteLogic'

const GEN3_BLOCKS_OFFSET = 0x20
const GEN3_BLOCK_SIZE = 12
const GEN456_BLOCKS_OFFSET = 0x08
const GEN45_BLOCK_SIZE = 0x20
const GEN6_BLOCK_SIZE = 0x38

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
]

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
]

export const unshuffleBlocks = (
  bytes: Uint8Array,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  const blockOrder = unshuffleBlockOrders[shiftValue]
  const growthBlock = bytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  )
  const attackBlock = bytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  )
  const statsBlock = bytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  )
  const miscBlock = bytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  )
  const unshuffledBytes = bytes
  unshuffledBytes.set(growthBlock, startIndex)
  unshuffledBytes.set(attackBlock, startIndex + blockSize)
  unshuffledBytes.set(statsBlock, startIndex + 2 * blockSize)
  unshuffledBytes.set(miscBlock, startIndex + 3 * blockSize)
  return unshuffledBytes
}

export const shuffleBlocks = (
  bytes: Uint8Array,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  const blockOrder = shuffleBlockOrders[shiftValue]
  const firstBlock = bytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  )
  const secondBlock = bytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  )
  const thirdBlock = bytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  )
  const fourthBlock = bytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  )
  const unshuffledBytes = bytes
  unshuffledBytes.set(firstBlock, startIndex)
  unshuffledBytes.set(secondBlock, startIndex + blockSize)
  unshuffledBytes.set(thirdBlock, startIndex + 2 * blockSize)
  unshuffledBytes.set(fourthBlock, startIndex + 3 * blockSize)
  return unshuffledBytes
}

export const shuffleBlocksGen3 = (bytes: Uint8Array) => {
  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = personalityValue % 24
  return shuffleBlocks(bytes, shiftValue, GEN3_BLOCK_SIZE, GEN3_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen3 = (bytes: Uint8Array) => {
  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = personalityValue % 24
  return unshuffleBlocks(bytes, shiftValue, GEN3_BLOCK_SIZE, GEN3_BLOCKS_OFFSET)
}

export const decryptByteArrayGen3 = (bytes: Uint8Array) => {
  const unencryptedBytes = bytes
  const encryptionKey =
    bytesToUint32LittleEndian(bytes, 0x00) ^ bytesToUint32LittleEndian(bytes, 0x04)
  for (let i = GEN3_BLOCKS_OFFSET; i < GEN3_BLOCKS_OFFSET + 4 * GEN3_BLOCK_SIZE; i += 4) {
    let value = bytesToUint32LittleEndian(unencryptedBytes, i)
    value = value ^ encryptionKey
    unencryptedBytes.set(uint32ToBytesLittleEndian(value), i)
  }
  return unencryptedBytes
}

export const shuffleBlocksGen45 = (bytes: Uint8Array) => {
  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = ((personalityValue & 0x3e000) >> 0xd) % 24
  return shuffleBlocks(bytes, shiftValue, GEN45_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen45 = (bytes: Uint8Array) => {
  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = ((personalityValue & 0x3e000) >> 0xd) % 24
  return unshuffleBlocks(bytes, shiftValue, GEN45_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

const decryptByteArray = (
  bytes: Uint8Array,
  seed: number,
  blockSize: number,
  blockOffset: number
) => {
  const unencryptedBytes = bytes
  for (let i = blockOffset; i < blockOffset + 4 * blockSize; i += 2) {
    const bigIntSeed = bigInt(0x41c64e6d).times(seed).plus(0x6073)
    seed = bigIntSeed.and(0xffffffff).toJSNumber()
    const xorValue = (seed >> 16) & 0xffff
    const unencryptedWord = bytesToUint16LittleEndian(bytes, i) ^ xorValue
    const unencryptedWordBytes = uint16ToBytesLittleEndian(unencryptedWord)
    unencryptedBytes.set(unencryptedWordBytes, i)
  }
  return unencryptedBytes
}

export const decryptByteArrayGen45 = (bytes: Uint8Array) => {
  const checksum = bytesToUint16LittleEndian(bytes, 0x06)
  return decryptByteArray(bytes, checksum, GEN45_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const shuffleBlocksGen6 = (bytes: Uint8Array) => {
  const encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24
  return shuffleBlocks(bytes, shiftValue, GEN6_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen6 = (bytes: Uint8Array) => {
  const encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24
  return unshuffleBlocks(bytes, shiftValue, GEN6_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const decryptByteArrayGen6 = (bytes: Uint8Array) => {
  const encryptionConstant = bytesToUint32LittleEndian(bytes, 0x00)
  return decryptByteArray(bytes, encryptionConstant, GEN6_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

const SeedTable: number[] = [
  0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 0x8108, 0x9129, 0xa14a, 0xb16b,
  0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
  0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 0x2462, 0x3443, 0x0420, 0x1401,
  0x64e6, 0x74c7, 0x44a4, 0x5485, 0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
  0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 0xb75b, 0xa77a, 0x9719, 0x8738,
  0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823,
  0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 0x5af5, 0x4ad4, 0x7ab7, 0x6a96,
  0x1a71, 0x0a50, 0x3a33, 0x2a12, 0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
  0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 0xedae, 0xfd8f, 0xcdec, 0xddcd,
  0xad2a, 0xbd0b, 0x8d68, 0x9d49, 0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70,
  0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 0x9188, 0x81a9, 0xb1ca, 0xa1eb,
  0xd10c, 0xc12d, 0xf14e, 0xe16f, 0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
  0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 0x02b1, 0x1290, 0x22f3, 0x32d2,
  0x4235, 0x5214, 0x6277, 0x7256, 0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
  0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 0xa7db, 0xb7fa, 0x8799, 0x97b8,
  0xe75f, 0xf77e, 0xc71d, 0xd73c, 0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
  0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 0x5844, 0x4865, 0x7806, 0x6827,
  0x18c0, 0x08e1, 0x3882, 0x28a3, 0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
  0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 0xfd2e, 0xed0f, 0xdd6c, 0xcd4d,
  0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1,
  0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 0x6e17, 0x7e36, 0x4e55, 0x5e74,
  0x2e93, 0x3eb2, 0x0ed1, 0x1ef0,
]

export const CRC16_CCITT = (bytes: Uint8Array, start: number, size: number) => {
  let sum = 0xffff

  for (let i = start; i < start + size; i++) {
    sum = ((sum << 8) & 0xffff) ^ SeedTable[bytes[i] ^ ((sum >> 8) & 0xffff)]
  }

  return sum
}

const SeedTableInvert = [
  0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241, 0xc601, 0x06c0, 0x0780, 0xc741,
  0x0500, 0xc5c1, 0xc481, 0x0440, 0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
  0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841, 0xd801, 0x18c0, 0x1980, 0xd941,
  0x1b00, 0xdbc1, 0xda81, 0x1a40, 0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
  0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641, 0xd201, 0x12c0, 0x1380, 0xd341,
  0x1100, 0xd1c1, 0xd081, 0x1040, 0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
  0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441, 0x3c00, 0xfcc1, 0xfd81, 0x3d40,
  0xff01, 0x3fc0, 0x3e80, 0xfe41, 0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
  0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41, 0xee01, 0x2ec0, 0x2f80, 0xef41,
  0x2d00, 0xedc1, 0xec81, 0x2c40, 0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
  0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041, 0xa001, 0x60c0, 0x6180, 0xa141,
  0x6300, 0xa3c1, 0xa281, 0x6240, 0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
  0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41, 0xaa01, 0x6ac0, 0x6b80, 0xab41,
  0x6900, 0xa9c1, 0xa881, 0x6840, 0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
  0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40, 0xb401, 0x74c0, 0x7580, 0xb541,
  0x7700, 0xb7c1, 0xb681, 0x7640, 0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
  0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241, 0x9601, 0x56c0, 0x5780, 0x9741,
  0x5500, 0x95c1, 0x9481, 0x5440, 0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
  0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841, 0x8801, 0x48c0, 0x4980, 0x8941,
  0x4b00, 0x8bc1, 0x8a81, 0x4a40, 0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
  0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641, 0x8201, 0x42c0, 0x4380, 0x8341,
  0x4100, 0x81c1, 0x8081, 0x4040,
]

function not16Bit(val: number): number {
  return ((val & 0xffff) ^ 0xffff) & 0xffff
}

export const CRC16_Invert = (bytes: Uint8Array, start: number, size: number) => {
  let chk = 0xffff

  for (let i = start; i < start + size; i++) {
    const b = bytes[i]
    chk = (SeedTableInvert[b ^ (chk & 0xff)] ^ (chk >> 8)) & 0xffff
  }

  return not16Bit(chk)
}

const SHA1_LEN = 20

export const SignMemeDataInPlace = (bytes: Uint8Array, start: number, size: number) => {
  const payload = bytes.slice(0, bytes.length - 8)
  const hash = bytes.slice(bytes.length - 8)

  const shasum = crypto.createHash('sha1')
  shasum.update(payload)
  shasum.digest()
}
