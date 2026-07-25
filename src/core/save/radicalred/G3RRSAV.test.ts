import { NationalDexMax } from '@openhome-core/resources/consts/NationalDex'
import { supportsMon } from '@openhome-core/save/util'
import { range } from '@openhome-core/util/functional'
import { Language, Lookup } from '@pkm-rs/pkg'
import { expect, test } from 'vitest'
import { G3RRSAV } from './G3RRSAV'

test(`Pokémon Radical Red supports all mon base forms`, () => {
  for (const i of range(NationalDexMax)) {
    const nationalDex = i + 1
    expect(
      supportsMon(G3RRSAV, nationalDex, 0),
      `Pokémon ${Lookup.speciesName(nationalDex, Language.English)} is transferrable to Radical Red`
    ).toBe(true)
  }
})
