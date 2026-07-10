import { toBase64 } from '@openhome-core/util'
import { writeBlock } from '@pkm-rs/pkg/pkm_rs'
import { expect, test } from 'vitest'
import { SCBoolBlock, SCObjectBlock } from './SCBlock'
import { jsBlockToRustBlock } from './SwishCrypto'

test('write sc block', () => {
  const block: SCObjectBlock = {
    blockType: 'object',
    raw: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
    key: 0xdeadbeef,
    type: 'Object',
  }

  const buffer = new Uint8Array(60)

  let offset = 0

  offset = writeBlock(jsBlockToRustBlock(block), buffer, offset)
  expect(offset).toBe(17)

  const block2: SCObjectBlock = {
    blockType: 'object',
    raw: new Uint8Array([5, 7, 5]).buffer,
    key: 0xefe00efe,
    type: 'Object',
  }

  offset = writeBlock(jsBlockToRustBlock(block2), buffer, offset)
  expect(offset).toBe(29)

  const block3: SCBoolBlock = {
    blockType: 'bool',
    key: 0xefe00efe,
    type: { Scalar: 'Bool1' },
  }

  offset = writeBlock(jsBlockToRustBlock(block3), buffer, offset)
  expect(offset).toBe(34)
  expect(toBase64(buffer)).toBe(
    '776t3ttO+0yPQmWoQ6X0SSP+DuDv9QDcCG3+xqX+DuDv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  )
})
