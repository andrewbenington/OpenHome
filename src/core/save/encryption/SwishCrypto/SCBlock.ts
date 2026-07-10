import { BlockTypeId, ScalarTypeId } from '@pkm-rs/pkg/pkm_rs'

export type SCBoolBlock = {
  key: number
  type: BlockTypeId
  raw?: undefined
  subtype?: undefined
  blockType: 'bool'
}

export type SCObjectBlock = {
  key: number
  type: BlockTypeId
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'object'
}

export type SCArrayBlock = {
  key: number
  type: BlockTypeId
  raw: ArrayBuffer
  subtype: ScalarTypeId
  blockType: 'array'
}

export type SCValueBlock = {
  key: number
  type: BlockTypeId
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'value'
}

export type SCBlock = SCBoolBlock | SCObjectBlock | SCArrayBlock | SCValueBlock
