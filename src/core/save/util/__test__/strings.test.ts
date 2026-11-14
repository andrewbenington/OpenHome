import { utf16BytesToString, writeGen4StringToBytes } from '@openhome-core/util'
import { TextDecoder } from 'node:util' // (ESM style imports)
import { expect, test } from 'vitest'
;(global as any).TextDecoder = TextDecoder

test('utf16 decoding null terminated', () => {
  const stringBuffer = new Uint8Array([
    0x53, 0x00, 0x6c, 0x00, 0x6f, 0x00, 0x77, 0x00, 0x70, 0x00, 0x6f, 0x00, 0x6b, 0x00, 0x65, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]).buffer

  expect(utf16BytesToString(stringBuffer, 0, 12)).toStrictEqual('Slowpoke')
})

const gen4Chars = (dataView: DataView, length: number) =>
  Array.from({ length }, (_, i) => dataView.getUint16(i * 2, true))

test('gen 4 encoding of the Japanese long vowel mark', () => {
  // ー (U+30FC) was missing from the map and got written as 0x0000 (#964)
  const dataView = new DataView(new ArrayBuffer(12))
  writeGen4StringToBytes(dataView, 'ワンリキー', 0, 6)

  expect(gen4Chars(dataView, 6)).toStrictEqual([0x009f, 0x00a1, 0x009b, 0x005e, 0x00f1, 0xffff])
})

test('gen 4 encoding replaces unsupported characters with ?', () => {
  const dataView = new DataView(new ArrayBuffer(6))
  writeGen4StringToBytes(dataView, 'ワ漢', 0, 3)

  expect(gen4Chars(dataView, 3)).toStrictEqual([0x009f, 0x01ac, 0xffff])
})
