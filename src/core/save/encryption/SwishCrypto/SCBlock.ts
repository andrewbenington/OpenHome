import { BlockType, ScalarType } from '@pkm-rs/pkg/pkm_rs'

export type SCBoolBlock = {
  key: number
  type: BlockType
  raw?: undefined
  subtype?: undefined
  blockType: 'bool'
}

export type SCObjectBlock = {
  key: number
  type: BlockType
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'object'
}

export type SCArrayBlock = {
  key: number
  type: BlockType
  raw: ArrayBuffer
  subtype: ScalarType
  blockType: 'array'
}

export type SCValueBlock = {
  key: number
  type: BlockType
  raw: ArrayBuffer
  subtype?: undefined
  blockType: 'value'
}

export type SCBlock = SCBoolBlock | SCObjectBlock | SCArrayBlock | SCValueBlock
