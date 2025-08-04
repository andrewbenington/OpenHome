const bytesToNumberBigEndian = (bytes: Uint8Array) => {
  let value = 0

  bytes.forEach((byte) => {
    value *= 256
    value += byte
  })
  return value
}

export const bytesToInt32BigEndian = (bytes: Uint8Array, index: number) => {
  const unsigned = bytesToNumberBigEndian(bytes.slice(index, index + 4))

  if (!(bytes[index] & 0b10000000)) {
    return unsigned
  }

  return -(~(unsigned - 1) & 0xffffffff)
}

export const uint16ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([(value >> 8) & 0xff, value & 0xff])
}

export const uint24ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff])
}

export const uint32ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff,
  ])
}

export const setFlag = (dataView: DataView, offset: number, index: number, value: boolean) => {
  const byteIndex = offset + Math.floor(index / 8)
  const bitIndex = index % 8

  if (byteIndex < dataView.byteLength) {
    const newByte =
      (dataView.getUint8(byteIndex) & (0xff - 2 ** bitIndex)) | (value ? 2 ** bitIndex : 0)

    dataView.setUint8(byteIndex, newByte)
  }
}

export const getFlag = (dataView: DataView, offset: number, index: number) => {
  const byteIndex = offset + Math.floor(index / 8)
  const bitIndex = index % 8

  if (byteIndex < dataView.byteLength) {
    return !!((dataView.getUint8(byteIndex) >> bitIndex) & 0x1)
  }

  return false
}

export function getFlagIndexes(
  dataView: DataView,
  byteOffset: number,
  bitOffset: number,
  rangeBitCount: number
) {
  const indexes: number[] = []

  for (let i = 0; i < rangeBitCount; i++) {
    if (getFlag(dataView, byteOffset, bitOffset + i)) {
      indexes.push(i)
    }
  }

  return indexes
}

export function setFlagIndexes(
  dataView: DataView,
  byteOffset: number,
  bitOffset: number,
  indexes: number[]
) {
  const sortedIndexes = indexes.sort()
  let i = 0

  sortedIndexes.forEach((index) => {
    while (i < index) {
      setFlag(dataView, byteOffset, bitOffset + i, false)
      i++
    }

    setFlag(dataView, byteOffset, bitOffset + index, true)
    i++
  })
}

export function getByteIndexes(dataView: DataView, byteOffset: number, rangeByteCount: number) {
  const indexes: number[] = []

  for (let i = 0; i < rangeByteCount; i++) {
    if (dataView.getUint8(byteOffset + i)) {
      indexes.push(i)
    }
  }

  return indexes
}

export function setByteIndexes(dataView: DataView, byteOffset: number, indexes: number[]) {
  const sortedIndexes = indexes.sort()
  let i = 0

  sortedIndexes.forEach((index) => {
    while (i < index) {
      dataView.setUint8(byteOffset + i, 0)
      i++
    }

    dataView.setUint8(byteOffset + index, 1)
    i++
  })
}

export function uIntFromBufferBits(
  dataView: DataView,
  byteOffset: number,
  bitOffset: number,
  bitCount: number,
  littleEndian: boolean = true
) {
  let num = 0

  switch (Math.ceil((bitOffset + bitCount) / 8)) {
    case 1:
      num = dataView.getUint8(byteOffset)
      break
    case 2:
      num = dataView.getUint16(byteOffset, littleEndian)
      break
    case 3:
    case 4:
      num = dataView.getUint32(byteOffset, littleEndian)
      break
    default:
      throw new Error('bitCount must be <= 32')
  }

  return (num >> bitOffset) & getBitMask(bitCount)
}

export function uIntToBufferBits(
  dataView: DataView,
  value: number,
  byteOffset: number,
  bitOffset: number,
  bitCount: number,
  littleEndian: boolean = true
) {
  let existingValue = 0
  let newValue = 0

  switch (Math.ceil((bitOffset + bitCount) / 8)) {
    case 1:
      existingValue = dataView.getUint8(byteOffset)
      newValue = setNumberAtBitOffset(existingValue, value, bitOffset, bitCount)
      dataView.setUint8(byteOffset, newValue)
      break
    case 2:
      existingValue = dataView.getUint16(byteOffset, littleEndian)
      newValue = setNumberAtBitOffset(existingValue, value, bitOffset, bitCount)
      dataView.setUint16(byteOffset, newValue, littleEndian)
      break
    case 3:
    case 4:
      existingValue = dataView.getUint32(byteOffset, littleEndian)
      newValue = setNumberAtBitOffset(existingValue, value, bitOffset, bitCount)
      dataView.setUint32(byteOffset, newValue, littleEndian)
      break
    default:
      throw new Error('bitCount must be <= 32')
  }
}

function getBitMask(bitCount: number) {
  return 2 ** bitCount - 1
}

function setNumberAtBitOffset(
  value: number,
  numberToSet: number,
  bitOffset: number,
  bitCount: number
) {
  const mask = Number.MAX_SAFE_INTEGER ^ (getBitMask(bitCount) << bitOffset)
  let newValue = value & mask

  newValue |= (numberToSet & getBitMask(bitCount)) << bitOffset
  return newValue
}

export const bytesToString = (value: number, numBytes: number) => {
  return value.toString(16).padStart(numBytes * 2, '0')
}

export function getFlagsInRange(dataView: DataView, offset: number, size: number) {
  const flags: number[] = []

  for (let i = 0; i < size * 8; i++) {
    if (getFlag(dataView, offset, i)) {
      flags.push(i)
    }
  }

  return flags
}
