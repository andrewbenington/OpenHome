import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { NationalDexMax } from '@openhome-core/resources/consts/NationalDex'
import { supportsMon } from '@openhome-core/save/util'
import { R, range } from '@openhome-core/util/functional'
import {
  ExtraFormIndex,
  getDefaultConvertStrategy,
  Language,
  Lookup,
  NationalDex,
} from '@pkm-rs/pkg'
import { expect, test } from 'vitest'
import { G3RRSAV } from './G3RRSAV'
import PK3RR from './PK3RR'

test(`Pokémon Radical Red supports all mon base forms aside from Maushold`, () => {
  for (const i of range(NationalDexMax)) {
    const nationalDex = i + 1
    if (nationalDex !== NationalDex.Maushold) {
      expect(
        supportsMon(G3RRSAV, nationalDex, 0),
        `Pokémon ${Lookup.speciesName(nationalDex, Language.English)} (${nationalDex}) is transferrable to Radical Red`
      ).toBe(true)
    } else {
      expect(
        supportsMon(G3RRSAV, nationalDex, 1),
        `Pokémon ${Lookup.speciesName(nationalDex, Language.English)} (${nationalDex}) is transferrable to Radical Red`
      ).toBe(true)
    }
  }
})

test(`Seviian pokémon keeps their Seviian forms`, () => {
  const ursaringSevii = OHPKM.defaultWithSpecies(NationalDex.Ursaring, 0)
  ursaringSevii.extraFormIndex = ExtraFormIndex.UrsaringSevii

  const pk3rr = R.assert(PK3RR.fromOhpkm(ursaringSevii, getDefaultConvertStrategy()))
  const pk3rrRoundTrip = PK3RR.fromBytes(pk3rr.toBytes())

  expect(pk3rrRoundTrip.extraFormIndex).toBe(ExtraFormIndex.UrsaringSevii)
})
