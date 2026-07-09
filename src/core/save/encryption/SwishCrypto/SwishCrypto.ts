import {
  Block,
  decryptBlocks,
  hashIsValid,
  swishCryptoHash,
  swishCryptoStaticXorPad,
} from '@pkm-rs/pkg/pkm_rs'
import { SCBlock, writeSCBlock } from './SCBlock'

const SIZE_HASH = 0x20

export function computeHash(data: Uint8Array): Uint8Array {
  return swishCryptoHash(data)
}

function getIsHashValid(data: Uint8Array) {
  return hashIsValid(data)
}

function cryptStaticXorpadBytes(data: Uint8Array): Uint8Array {
  return swishCryptoStaticXorPad(data)
}

function rustBlockToJsBlock(rustBlock: Block): SCBlock {
  if (rustBlock.data === 'Bool')
    return { blockType: 'bool', key: rustBlock.key, type: rustBlock.type_id }
  if ('Object' in rustBlock.data) {
    return {
      blockType: 'object',
      key: rustBlock.key,
      type: rustBlock.type_id,
      raw: rustBlock.data.Object.bytes.buffer,
    }
  }
  if ('Array' in rustBlock.data) {
    const { bytes, subtype } = rustBlock.data.Array
    return {
      blockType: 'array',
      key: rustBlock.key,
      type: rustBlock.type_id,
      raw: bytes.buffer,
      subtype,
    }
  }
  return {
    blockType: 'value',
    key: rustBlock.key,
    type: rustBlock.type_id,
    raw: rustBlock.data.Value.bytes.buffer,
  }
}

function decrypt(data: Uint8Array): SCBlock[] {
  return decryptBlocks(data).map(rustBlockToJsBlock)
}

function getDecryptedRawData(blocks: SCBlock[], size: number): Uint8Array {
  const buffer = new Uint8Array(size)
  let offset = 0

  for (const block of blocks) {
    offset = writeSCBlock(block, buffer, offset)
  }

  return buffer.slice(0, offset)
}

function encrypt(blocks: SCBlock[], size: number): Uint8Array {
  const rawBytes = getDecryptedRawData(blocks, size)
  const xoredData = cryptStaticXorpadBytes(rawBytes)
  const hash = computeHash(xoredData)
  const encrypted = new Uint8Array(xoredData.length + hash.length)

  encrypted.set(xoredData, 0)
  encrypted.set(hash, xoredData.length)
  return encrypted
}

export const SwishCrypto = {
  SIZE_HASH,
  computeHash,
  getIsHashValid,
  decrypt,
  encrypt,
}
