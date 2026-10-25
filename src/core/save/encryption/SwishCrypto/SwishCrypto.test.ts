import { toBase64 } from '@openhome-core/util'
import { Block, writeBlock } from '@pkm-rs/pkg'
import { expect, test } from 'vitest'

test('write sc block', () => {
  const block: Block = {
    data: { Object: { bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) } },
    key: 0xdeadbeef,
  }

  const buffer = new Uint8Array(60)

  let offset = 0

  offset = writeBlock(block, buffer, offset)
  expect(offset).toBe(17)

  const block2: Block = {
    data: { Object: { bytes: new Uint8Array([5, 7, 5]) } },
    key: 0xefe00efe,
  }

  offset = writeBlock(block2, buffer, offset)
  expect(offset).toBe(29)

  const block3: Block = {
    key: 0xefe00efe,
    data: { Bool: 'Bool1' },
  }

  offset = writeBlock(block3, buffer, offset)
  expect(offset).toBe(34)
  expect(toBase64(buffer)).toBe(
    '776t3ttO+0yPQmWoQ6X0SSP+DuDv9QDcCG3+xqX+DuDv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  )
})
