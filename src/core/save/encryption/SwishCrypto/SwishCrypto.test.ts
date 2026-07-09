import { swishCryptoHash } from '@pkm-rs/pkg/pkm_rs'
import { expect, test } from 'vitest'
import { computeHash } from './SwishCrypto'

test('swish crypto hash calculated correctly', () => {
  const buffer = new ArrayBuffer(256)
  const jsHash = computeHash(new Uint8Array(buffer))
  const wasmHash = swishCryptoHash(new Uint8Array(buffer))

  expect(wasmHash).toStrictEqual(jsHash)
})
