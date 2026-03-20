import { ExtraFormIndex } from '@pkm-rs/pkg'
import { describe, expect, test } from 'vitest'
import { supportsMon } from '..'
import { NationalDex } from '../../../../../packages/pokemon-resources/src/consts/NationalDex'
import { OFFICIAL_SAVE_TYPES } from '../../../../ui/state/appInfo'
import { G8LumiSAV } from '../../luminescentplatinum/G8LUMISAV'
import { ORASSAV } from '../../ORASSAV'

describe('official saves', () => {
  for (const saveType of OFFICIAL_SAVE_TYPES) {
    function supportsPikachuExtraForm(extraFormIndex: ExtraFormIndex) {
      return supportsMon(saveType, NationalDex.Pikachu, 0, extraFormIndex)
    }

    test(`save class ${saveType.saveTypeID} supports standard Pikachu but not Surfing Pikachu`, () => {
      expect(supportsMon(saveType, NationalDex.Pikachu, 0)).toBe(true)
      expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuSurfing)).toBe(false)
    })

    if (saveType.saveTypeID !== 'ORASSAV') {
      test(`save class ${saveType.saveTypeID} does not support cosplay Pikachu`, () => {
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuCosplay)).toBe(false)
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuBelle)).toBe(false)
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuLibre)).toBe(false)
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuPhD)).toBe(false)
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuRockStar)).toBe(false)
        expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuPopStar)).toBe(false)
      })
    }
  }

  test('ORAS supports cosplay Pikachu', () => {
    function supportsPikachuExtraForm(extraFormIndex: ExtraFormIndex) {
      return supportsMon(ORASSAV, NationalDex.Pikachu, 0, extraFormIndex)
    }

    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuCosplay)).toBe(true)
    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuBelle)).toBe(true)
    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuLibre)).toBe(true)
    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuPhD)).toBe(true)
    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuRockStar)).toBe(true)
    expect(supportsPikachuExtraForm(ExtraFormIndex.PikachuPopStar)).toBe(true)
  })
})

describe('Luminescent Platinum', () => {
  test('Luminescent Platinum supports its exclusive forms', () => {
    expect(supportsMon(G8LumiSAV, NationalDex.Eevee, 0, ExtraFormIndex.EeveeBandana)).toBe(true)
    expect(supportsMon(G8LumiSAV, NationalDex.Gengar, 0, ExtraFormIndex.GengarStitched)).toBe(true)
    expect(supportsMon(G8LumiSAV, NationalDex.Onix, 0, ExtraFormIndex.OnixCrystal)).toBe(true)
    expect(supportsMon(G8LumiSAV, NationalDex.Venusaur, 0, ExtraFormIndex.VenusaurClone)).toBe(true)
  })

  test('Luminescent Platinum does not support other ROM hack forms', () => {
    expect(supportsMon(G8LumiSAV, NationalDex.Pikachu, 0, ExtraFormIndex.PikachuSurfing)).toBe(
      false
    )
    expect(supportsMon(G8LumiSAV, NationalDex.Dialga, 0, ExtraFormIndex.DialgaPrimal)).toBe(false)
  })
})
