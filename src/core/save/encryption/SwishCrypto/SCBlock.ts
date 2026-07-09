import { ScalarTypeId, scalarTypeIndex, scalarTypeSize } from '@pkm-rs/pkg/pkm_rs'
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
  type: number
  raw: ArrayBuffer
  subtype: ScalarTypeId
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

export function writeSCBlock(block: SCBlock, bytes: Uint8Array, offset: number): number {
  let currentOffset = offset
  const dataView = new DataView(bytes.buffer)

  // write key XORed
  dataView.setUint32(currentOffset, block.key, true)
  currentOffset += 4

  // write type XORed
  const xk = new SCXorShift32(block.key)
  const next = xk.Next()
  const typeXored = (block.type ^ next) & 0xff

  dataView.setUint8(currentOffset, typeXored)
  currentOffset += 1

  if (block.blockType === 'object') {
    // write data size XORed
    const lengthXored = (block.raw.byteLength ^ xk.Next32()) & 0xffffffff

    dataView.setUint32(currentOffset, lengthXored, true)
    currentOffset += 4
  } else if (block.blockType === 'array') {
    // write array length XORed
    const entryCount = block.raw.byteLength / scalarTypeSize(block.subtype)

    dataView.setUint32(currentOffset, (entryCount ^ xk.Next32()) & 0xffffffff, true)
    currentOffset += 4

    // write subtype XORed
    const subtypeXored = (scalarTypeIndex(block.subtype) ^ xk.Next()) & 0xff

    dataView.setUint8(currentOffset, subtypeXored)
    currentOffset += 1
  }

  if (block.raw) {
    new Uint8Array(block.raw).forEach((byte) => {
      dataView.setUint8(currentOffset, (byte ^ xk.Next()) & 0xff)
      currentOffset += 1
    })
  }

  return currentOffset
}
