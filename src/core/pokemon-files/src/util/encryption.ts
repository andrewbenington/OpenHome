const GEN3_BLOCKS_OFFSET = 0x20
const GEN3_BLOCK_SIZE = 12
const GEN456_BLOCKS_OFFSET = 0x08
const GEN45_BLOCK_SIZE = 0x20
const GEN67_BLOCK_SIZE = 0x38
const GEN8_BLOCK_SIZE = 0x50
const GEN8_ENCRYPTED_SIZE = 8 + 4 * GEN8_BLOCK_SIZE
const GEN8A_BLOCK_SIZE = 0x58
const GEN8A_ENCRYPTED_SIZE = 8 + 4 * GEN8A_BLOCK_SIZE

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

const unshuffleBlocks = (
  bytes: ArrayBuffer,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  const unshuffledBytes = new Uint8Array(bytes)
  const blockOrder = unshuffleBlockOrders[shiftValue]
  const growthBlock = unshuffledBytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  )
  const attackBlock = unshuffledBytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  )
  const statsBlock = unshuffledBytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  )
  const miscBlock = unshuffledBytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  )

  unshuffledBytes.set(growthBlock, startIndex)
  unshuffledBytes.set(attackBlock, startIndex + blockSize)
  unshuffledBytes.set(statsBlock, startIndex + 2 * blockSize)
  unshuffledBytes.set(miscBlock, startIndex + 3 * blockSize)
  return unshuffledBytes.buffer
}

const shuffleBlocks = (
  bytes: ArrayBuffer,
  shiftValue: number,
  blockSize: number,
  startIndex: number
) => {
  const unshuffledBytes = new Uint8Array(bytes)
  const blockOrder = shuffleBlockOrders[shiftValue]
  const firstBlock = unshuffledBytes.slice(
    startIndex + blockOrder[0] * blockSize,
    startIndex + (blockOrder[0] + 1) * blockSize
  )
  const secondBlock = unshuffledBytes.slice(
    startIndex + blockOrder[1] * blockSize,
    startIndex + (blockOrder[1] + 1) * blockSize
  )
  const thirdBlock = unshuffledBytes.slice(
    startIndex + blockOrder[2] * blockSize,
    startIndex + (blockOrder[2] + 1) * blockSize
  )
  const fourthBlock = unshuffledBytes.slice(
    startIndex + blockOrder[3] * blockSize,
    startIndex + (blockOrder[3] + 1) * blockSize
  )

  unshuffledBytes.set(firstBlock, startIndex)
  unshuffledBytes.set(secondBlock, startIndex + blockSize)
  unshuffledBytes.set(thirdBlock, startIndex + 2 * blockSize)
  unshuffledBytes.set(fourthBlock, startIndex + 3 * blockSize)
  return unshuffledBytes.buffer
}

export const shuffleBlocksGen3 = (bytes: ArrayBuffer) => {
  const personalityValue = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = personalityValue % 24

  return shuffleBlocks(bytes, shiftValue, GEN3_BLOCK_SIZE, GEN3_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen3 = (bytes: ArrayBuffer) => {
  const personalityValue = new DataView(bytes).getUint32(0, true)
  const shiftValue = personalityValue % 24

  return unshuffleBlocks(bytes, shiftValue, GEN3_BLOCK_SIZE, GEN3_BLOCKS_OFFSET)
}

export const decryptByteArrayGen3 = (bytes: ArrayBuffer) => {
  const encryptedDV = new DataView(bytes)
  const unencryptedDV = new DataView(bytes)
  const encryptionKey = encryptedDV.getUint32(0x00, true) ^ encryptedDV.getUint32(0x04, true)

  for (let i = GEN3_BLOCKS_OFFSET; i < GEN3_BLOCKS_OFFSET + 4 * GEN3_BLOCK_SIZE; i += 4) {
    const value = encryptedDV.getUint32(i, true) ^ encryptionKey

    unencryptedDV.setUint32(i, value, true)
  }

  return unencryptedDV.buffer
}

export const shuffleBlocksGen45 = (bytes: ArrayBuffer) => {
  const personalityValue = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((personalityValue & 0x3e000) >> 0xd) % 24

  return shuffleBlocks(bytes, shiftValue, GEN45_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen45 = (bytes: ArrayBuffer) => {
  const personalityValue = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((personalityValue & 0x3e000) >> 0xd) % 24

  return unshuffleBlocks(bytes, shiftValue, GEN45_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

const ENCRYPTION_OFFSET = 8
const decryptByteArray = (bytes: ArrayBuffer, seed: number, blockSize: number) => {
  const boxSize = ENCRYPTION_OFFSET + 4 * blockSize
  const boxData = decryptArray(bytes, seed, ENCRYPTION_OFFSET, boxSize)
  if (bytes.byteLength === boxSize) {
    return boxData
  }
  return decryptArray(bytes, seed, boxSize, bytes.byteLength)
}

const decryptArray = (bytes: ArrayBuffer, seed: number, start: number, end: number) => {
  const unencryptedBytes = new Uint8Array(bytes)
  const dataView = new DataView(bytes)
  const newDataView = new DataView(bytes)

  for (let i = start; i < end; i += 2) {
    const bigIntSeed = BigInt(0x41c64e6d) * BigInt(seed) + BigInt(0x6073)

    seed = Number(bigIntSeed & BigInt(0xffffffff))
    const xorValue = (seed >> 16) & 0xffff
    const unencryptedWord = dataView.getUint16(i, true) ^ xorValue

    newDataView.setUint16(i, unencryptedWord, true)
  }

  return unencryptedBytes.buffer
}

export const decryptByteArrayGen45 = (bytes: ArrayBuffer) => {
  const checksum = new DataView(bytes).getUint16(0x06, true)

  return decryptByteArray(bytes, checksum, GEN45_BLOCK_SIZE)
}

export const shuffleBlocksGen67 = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return shuffleBlocks(bytes, shiftValue, GEN67_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen67 = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return unshuffleBlocks(bytes, shiftValue, GEN67_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const shuffleBlocksGen89 = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return shuffleBlocks(bytes, shiftValue, GEN8_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen89 = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return unshuffleBlocks(bytes, shiftValue, GEN8_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const shuffleBlocksGen8A = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return shuffleBlocks(bytes, shiftValue, GEN8A_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const unshuffleBlocksGen8A = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const shiftValue = ((encryptionConstant & 0x3e000) >> 0xd) % 24

  return unshuffleBlocks(bytes, shiftValue, GEN8A_BLOCK_SIZE, GEN456_BLOCKS_OFFSET)
}

export const decryptByteArrayGen67 = (bytes: ArrayBuffer) => {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)

  return decryptByteArray(bytes, encryptionConstant, GEN67_BLOCK_SIZE)
}

function cryptPKM(bytes: ArrayBuffer, boxSize: number) {
  const encryptionConstant = new DataView(bytes).getUint32(0x00, true)
  const boxData = bytes.slice(ENCRYPTION_OFFSET, boxSize)
  const partyData = bytes.slice(boxSize)

  return joinBuffers([
    bytes.slice(0, ENCRYPTION_OFFSET),
    decryptArray(boxData, encryptionConstant, 0, boxData.byteLength),
    decryptArray(partyData, encryptionConstant, 0, partyData.byteLength),
  ])
}

function joinBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const size = buffers.reduce((p, n) => (p += n.byteLength), 0)
  const array = new Uint8Array(size)
  let offset = 0

  buffers.forEach((buffer) => {
    array.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  })

  return array.buffer
}

export const decryptByteArrayGen89 = (bytes: ArrayBuffer) => {
  return cryptPKM(bytes, GEN8_ENCRYPTED_SIZE)
}

export const decryptByteArrayGen8A = (bytes: ArrayBuffer) => {
  return cryptPKM(bytes, GEN8A_ENCRYPTED_SIZE)
}

export const get16BitChecksumLittleEndian = (bytes: ArrayBuffer, start: number, end: number) => {
  let checksum = 0
  const dataView = new DataView(bytes)

  for (let i = start; i < end; i += 2) {
    checksum = (checksum + dataView.getUint16(i, true)) & 0xffff
  }

  return checksum
}
