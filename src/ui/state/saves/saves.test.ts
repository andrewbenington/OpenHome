import { assert } from 'console'
import { test } from 'vitest'
import { isMonLocation, MonLocation } from './reducer'

const validMonLocation: MonLocation = { box: 2, boxSlot: 3, isHome: true, bank: 4 }

test('should load initial save data correctly', () => {
  assert(isMonLocation(validMonLocation))
})
