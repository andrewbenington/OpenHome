import {
  Block,
  decryptBlocks,
  encryptBlocks,
  hashIsValid,
  swishCryptoHash,
} from '@pkm-rs/pkg/pkm_rs'
import { SCBlock } from './SCBlock'

const SIZE_HASH = 0x20

function rustBlockToJsBlock(rustBlock: Block): SCBlock {
  if (rustBlock.data === 'Bool')
    return { blockType: 'bool', key: rustBlock.key, type: rustBlock.block_type }
  if ('Object' in rustBlock.data) {
    return {
      blockType: 'object',
      key: rustBlock.key,
      type: rustBlock.block_type,
      raw: rustBlock.data.Object.bytes.buffer,
    }
  }
  if ('Array' in rustBlock.data) {
    const { bytes, subtype } = rustBlock.data.Array
    return {
      blockType: 'array',
      key: rustBlock.key,
      type: rustBlock.block_type,
      raw: bytes.buffer,
      subtype,
    }
  }
  return {
    blockType: 'value',
    key: rustBlock.key,
    type: rustBlock.block_type,
    raw: rustBlock.data.Value.bytes.buffer,
  }
}

export function jsBlockToRustBlock(jsBlock: SCBlock): Block {
  switch (jsBlock.blockType) {
    case 'bool':
      return { block_type: jsBlock.type, key: jsBlock.key, data: 'Bool' }
    case 'object':
      return {
        block_type: jsBlock.type,
        key: jsBlock.key,
        data: { Object: { bytes: new Uint8Array(jsBlock.raw) } },
      }
    case 'array':
      return {
        block_type: jsBlock.type,
        key: jsBlock.key,
        data: { Array: { bytes: new Uint8Array(jsBlock.raw), subtype: jsBlock.subtype } },
      }
    case 'value':
      return {
        block_type: jsBlock.type,
        key: jsBlock.key,
        data: { Value: { bytes: new Uint8Array(jsBlock.raw) } },
      }
  }
}

function decrypt(data: Uint8Array): SCBlock[] {
  return decryptBlocks(data).map(rustBlockToJsBlock)
}

function encrypt(blocks: SCBlock[], size: number): Uint8Array {
  return encryptBlocks(blocks.map(jsBlockToRustBlock), size)
}

export const SwishCrypto = {
  SIZE_HASH,
  computeHash: swishCryptoHash,
  getIsHashValid: hashIsValid,
  decrypt,
  encrypt,
}
