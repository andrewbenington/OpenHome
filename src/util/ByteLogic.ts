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

export const bytesToUint64LittleEndian = (bytes: Uint8Array, index: number) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 8));
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

export const uint16ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([(value >> 8) & 0xff, value & 0xff]);
};

export const get8BitChecksum = (
  bytes: Uint8Array,
  start: number,
  end: number
) => {
  let checksum = 0;
  for (let i = start; i <= end; i += 1) {
    checksum += bytes[i];
    checksum = checksum & 0xff;
  }
  return checksum;
};

export const get16BitChecksumLittleEndian = (
  bytes: Uint8Array,
  start: number,
  end: number
) => {
  let checksum = 0;
  for (let i = start; i < end; i += 2) {
    checksum = (checksum + bytesToUint16LittleEndian(bytes, i)) & 0xffff;
  }
  return checksum;
};

export const uint24ToBytesBigEndian = (value: number): Uint8Array => {
  return Uint8Array.from([
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ]);
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

export const setFlag = (
  buffer: Uint8Array,
  offset: number,
  index: number,
  value: boolean
) => {
  let byteIndex = offset + Math.floor(index / 8);
  let bitIndex = index % 8;
  if (byteIndex < buffer.length) {
    buffer[byteIndex] =
      (buffer[byteIndex] & (0xff - Math.pow(2, bitIndex))) |
      (value ? Math.pow(2, bitIndex) : 0);
  }
};

export const getFlag = (buffer: Uint8Array, offset: number, index: number) => {
  let byteIndex = offset + Math.floor(index / 8);
  let bitIndex = index % 8;
  if (byteIndex < buffer.length) {
    return !!((buffer[byteIndex] >> bitIndex) & 0x1);
  }
  return false;
};

export const bytesToString = (value: number, numBytes: number) => {
  return value.toString(16).padStart(numBytes * 2, '0');
};
