import { describe, expect, it } from 'vitest'
import { range, rangeInclusive } from './functional'

describe('range function', () => {
  it('generates a range of numbers from 0 to size-1 when given a single argument', () => {
    expect(range(5)).toEqual([0, 1, 2, 3, 4])
  })
})

describe('rangeInclusive function', () => {
  it('generates a range of numbers from start to end (inclusive)', () => {
    expect(rangeInclusive(1, 5)).toEqual([1, 2, 3, 4, 5])
  })
})
