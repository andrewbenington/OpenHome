import { bytesToUint32LittleEndian } from '../byteLogic'
import { SCXorShift32 } from './SCXorShift32'

export type SCBoolBlock = {
  key: number
  type: number
  raw?: undefined
  subtype?: undefined
  blockType: 'bool'
}

export type SCObjectBlock = {
  key: number
  type: number
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'object'
}

export type SCArrayBlock = {
  key: number
  type?: undefined
  raw: ArrayBuffer
  subtype: number
  blockType: 'array'
}

export type SCValueBlock = {
  key: number
  type: number
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'value'
}

export type SCBlock = SCBoolBlock | SCObjectBlock | SCArrayBlock | SCValueBlock

export function buildSCBlock(
  data: Uint8Array,
  offset: number
): { block: SCBlock; newOffset: number } {
  const key = bytesToUint32LittleEndian(data, offset)
  offset += 4

  const xk = new SCXorShift32(key)
  const next = xk.Next()
  const type = (data[offset++] ^ next) & 0xff

  switch (type) {
    case 1:
    case 2:
    case 3:
      // Bool1, Bool2, Bool3

      return {
        block: { key, type, blockType: 'bool' },
        newOffset: offset,
      }
    case 4: {
      // Object
      const numBytes = bytesToUint32LittleEndian(data, offset) ^ xk.Next32()
      offset += 4

      const arr = data.slice(offset, offset + numBytes)
      offset += numBytes

      for (let i = 0; i < arr.length; i++) {
        arr[i] ^= xk.Next()
      }

      return {
        block: { key, type, raw: arr.buffer, blockType: 'object' },
        newOffset: offset,
      }
    }
    case 5: {
      // Array
      const numEntries = bytesToUint32LittleEndian(data, offset) ^ xk.Next32()
      offset += 4

      const subtype = (data[offset++] ^ xk.Next()) & 0xff
      const numBytes = numEntries * getTypeSize(subtype)

      const arr = data.slice(offset, offset + numBytes)
      offset += numBytes

      for (let i = 0; i < arr.length; i++) {
        arr[i] ^= xk.Next()
      }

      return {
        block: { key, raw: arr.buffer, subtype, blockType: 'array' },
        newOffset: offset,
      }
    }

    default: {
      // Single Value Storage

      const numBytes = getTypeSize(type)
      const arr = data.slice(offset, offset + numBytes)
      offset += numBytes

      for (let i = 0; i < arr.length; i++) {
        arr[i] ^= xk.Next()
      }

      return {
        block: { key, type, raw: arr.buffer, blockType: 'value' },
        newOffset: offset,
      }
    }
  }
}

function getTypeSize(type: number) {
  switch (type) {
    case 3:
      return 1 // Bool3

    case 8:
      return 1 // Byte
    case 9:
      return 2 // UInt16
    case 10:
      return 4 // UInt32
    case 11:
      return 8 // UInt64

    case 12:
      return 1 // SByte
    case 13:
      return 2 // Int16
    case 14:
      return 4 // Int32
    case 15:
      return 8 // Int64

    case 16:
      return 4 // Single
    case 17:
      return 8 // Double

    default:
      throw new Error(`Invalid SC Type: ${type}`)
  }
}
