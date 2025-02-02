import { bytesToUint32LittleEndian } from '../byteLogic'
import { SCXorShift32 } from './SCXorShift32'

export class SCBlock {
  key: number
  type?: number
  raw?: Uint8Array
  subtype?: number

  constructor(key: number, type?: number, raw?: Uint8Array, subtype?: number) {
    this.key = key
    this.type = type
    this.raw = raw
    this.subtype = subtype
  }

  public static readFromOffset(
    data: Uint8Array,
    offset: number
  ): { block: SCBlock; newOffset: number } {
    const key = bytesToUint32LittleEndian(data, offset)
    offset += 4
    return this.readFromOffsetWithKey(data, key, offset)
  }

  public static readFromOffsetWithKey(
    data: Uint8Array,
    key: number,
    offset: number
  ): { block: SCBlock; newOffset: number } {
    const xk = new SCXorShift32(key)
    const next = xk.Next()
    const type = (data[offset++] ^ next) & 0xff
    // console.log(`offset: ${offset}; key: ${key}; next: ${next}`)

    let block: SCBlock
    if (key === 0x874da6fa) {
      console.log('trainer block')
    }

    switch (type) {
      case 1:
      case 2:
      case 3:
        // Bool1, Bool2, Bool3
        block = new SCBlock(key, type)
        break
      case 4: {
        // Object
        const numBytes = bytesToUint32LittleEndian(data, offset) ^ xk.Next32()
        offset += 4

        const arr = data.slice(offset, offset + numBytes)
        offset += numBytes

        for (let i = 0; i < arr.length; i++) {
          arr[i] ^= xk.Next()
        }

        block = new SCBlock(key, type, arr)
        break
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

        block = new SCBlock(key, undefined, arr, subtype)
        break
      }

      default: {
        // Single Value Storage

        const numBytes = getTypeSize(type)
        const arr = data.slice(offset, offset + numBytes)
        offset += numBytes

        for (let i = 0; i < arr.length; i++) {
          arr[i] ^= xk.Next()
        }

        block = new SCBlock(key, type, arr)
        break
      }
    }

    return { block, newOffset: offset }
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
