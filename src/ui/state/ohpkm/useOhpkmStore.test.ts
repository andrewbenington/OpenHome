import { expect, test } from 'vitest'
import { FORCE_MISSED_LOOKUP } from './useOhpkmStore'

test('no forced missed lookup', async () => {
  expect(FORCE_MISSED_LOOKUP).toBe(false)
})
