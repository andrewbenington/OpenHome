// Byte manipulation utilities

const bytesToNumberBigEndian = (bytes: Uint8Array) => {
  let value = 0
  bytes.forEach((byte) => {
    value *= 256
    value += byte
  })
  return value
}

const bytesToNumberLittleEndian = (bytes: Uint8Array) => {
  return bytesToNumberBigEndian(bytes.slice().reverse())
}

export const bytesToUint16LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 2))
}

export const bytesToUint32LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 4))
}

export const bytesToUint16BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 2))
}

export const bytesToUint32BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 4))
}

export const uint16ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([value & 0xff, (value >> 8) & 0xff])
}

export const uint32ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff,
  ])
}

export const writeUint32ToBuffer = (value: number, buffer: Uint8Array, offset: number) => {
  buffer.set(uint32ToBytesLittleEndian(value), offset)
}

export const writeUint16ToBuffer = (value: number, buffer: Uint8Array, offset: number) => {
  buffer.set(uint16ToBytesLittleEndian(value), offset)
}
