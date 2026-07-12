import {
  Block,
  BlockData,
  BlockType,
  decryptBlocks,
  encryptBlocks,
  hashIsValid,
  swishCryptoHash,
} from '@pkm-rs/pkg/pkm_rs'

const SIZE_HASH = 0x20

function decrypt(data: Uint8Array): Block[] {
  return decryptBlocks(data)
}

function encrypt(blocks: Block[], size: number): Uint8Array {
  return encryptBlocks(blocks, size)
}

export const SwishCrypto = {
  SIZE_HASH,
  computeHash: swishCryptoHash,
  getIsHashValid: hashIsValid,
  decrypt,
  encrypt,
}

export function blockIsType(block: Block, type: BlockType) {
  if (type === 'Array') {
    return 'Array' in block.data
  } else if (type === 'Object') {
    return 'Object' in block.data
  } else if ('Bool' in block.data) {
    return 'Bool' in type.Scalar && type.Scalar.Bool === block.data.Bool
  } else if ('Value' in block.data) {
    return 'Numeric' in type.Scalar && type.Scalar.Numeric === block.data.Value.dataype
  }

  return false
}

type KeysOfUnion<T> = T extends any ? keyof T : never

type DataType = KeysOfUnion<BlockData>

type DataOf<K extends DataType> = Extract<BlockData, Record<K, any>>[K]

type BlockDataOf<K extends DataType> = Record<K, DataOf<K>>

export type ObjectBlock = {
  key: number
  data: BlockDataOf<'Object'>
}

export type ArrayBlock = {
  key: number
  data: BlockDataOf<'Array'>
}

export type BoolBlock = {
  key: number
  data: BlockDataOf<'Bool'>
}

export type ValueBlock = {
  key: number
  data: BlockDataOf<'Value'>
}
