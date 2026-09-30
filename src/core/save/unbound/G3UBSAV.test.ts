import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import { ExtraFormIndex, getDefaultConvertStrategy, NationalDex } from '@pkm-rs/pkg'
import { expect, test } from 'vitest'
import PK3UB from './PK3UB'

test(`Surfing Pikachu keeps its form`, () => {
  const pikachuSurfing = OHPKM.defaultWithSpecies(NationalDex.Pikachu, 0)
  pikachuSurfing.extraFormIndex = ExtraFormIndex.PikachuSurfing

  const pk3ub = R.assert(PK3UB.fromOhpkm(pikachuSurfing, getDefaultConvertStrategy()))
  const pk3ubRoundTrip = PK3UB.fromBytes(pk3ub.toBytes())

  expect(pk3ubRoundTrip.extraFormIndex).toBe(ExtraFormIndex.PikachuSurfing)
})
