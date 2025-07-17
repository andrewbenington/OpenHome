export function getFlagsInRange(bytes: Uint8Array, offset: number, size: number) {
  const flags: number[] = []

  for (let i = 0; i < size * 8; i++) {
    if (getFlag(bytes, offset, i)) {
      flags.push(i)
    }
  }

  return flags
}

const bytesToNumberBigEndian = (bytes: Uint8Array) => {
  let value = 0

  bytes.forEach((byte) => {
    value *= 256
    value += byte
  })
  return value
}

const bytesToNumberLittleEndian = (bytes: Uint8Array) => {
  return bytesToNumberBigEndian(bytes.reverse())
}

export const bytesToUint16LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 2))
}

export const bytesToUint32LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 4))
}

export const bytesToUint64LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 8))
}

export const bytesToUint16BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 2))
}

export const bytesToUint24BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 3))
}

export const bytesToUint32BigEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberBigEndian(bytes.slice(index, index + 4))
}

export const bytesToInt32BigEndian = (bytes: Uint8Array, index: number) => {
  const unsigned = bytesToNumberBigEndian(bytes.slice(index, index + 4))

  if (!(bytes[index] & 0b10000000)) {
    return unsigned
  }
  return -(~(unsigned - 1) & 0xffffffff)
}

export const uint16ToBytesLittleEndian = (value: number): Uint8Array => {
  return Uint8Array.from([value & 0xff, (value >> 8) & 0xff])
}

export const uint16ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([(value >> 8) & 0xff, value & 0xff])
}

export const get8BitChecksum = (bytes: Uint8Array, start: number, end: number) => {
  let checksum = 0

  for (let i = start; i <= end; i += 1) {
    checksum += bytes[i]
    checksum = checksum & 0xff
  }
  return checksum
}

export const get16BitChecksumLittleEndian = (bytes: ArrayBuffer, start: number, end: number) => {
  let checksum = 0

  for (let i = start; i < end; i += 2) {
    const nextVal = bytesToUint16LittleEndian(new Uint8Array(bytes), i)

    console.log(nextVal)

    checksum = (checksum + nextVal) & 0xffff
  }
  return checksum
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

export const uint32ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ])
}

export const writeUint32ToBuffer = (value: number, buffer: Uint8Array, offset: number) => {
  buffer.set(uint32ToBytesLittleEndian(value), offset)
}

export const writeUint16ToBuffer = (value: number, buffer: Uint8Array, offset: number) => {
  buffer.set(uint16ToBytesLittleEndian(value), offset)
}

export const setFlag = (buffer: Uint8Array, offset: number, index: number, value: boolean) => {
  const byteIndex = offset + Math.floor(index / 8)
  const bitIndex = index % 8

  if (byteIndex < buffer.length) {
    buffer[byteIndex] = (buffer[byteIndex] & (0xff - 2 ** bitIndex)) | (value ? 2 ** bitIndex : 0)
  }
}

export const getFlag = (buffer: Uint8Array, offset: number, index: number) => {
  const byteIndex = offset + Math.floor(index / 8)
  const bitIndex = index % 8

  if (byteIndex < buffer.length) {
    return !!((buffer[byteIndex] >> bitIndex) & 0x1)
  }
  return false
}

export const bytesToString = (value: number, numBytes: number) => {
  return value.toString(16).padStart(numBytes * 2, '0')
}

export function wordsToUint8Array(words: number[], sigBytes: number) {
  const byteArray = new Uint8Array(sigBytes)
  let byteIndex = 0

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    let word = words[wordIndex]

    for (let byteOffset = 3; byteOffset >= 0; byteOffset--) {
      if (byteIndex < sigBytes) {
        byteArray[byteIndex++] = (word >> (8 * byteOffset)) & 0xff
      }
    }
  }

  return byteArray
}

// export function b64Encode(u8: Uint8Array): string {
//   return Buffer.from(u8).toString('base64')
// }
