import { NationalDexMax } from '@openhome-core/resources/consts/NationalDex'
import { calculateStats, MetadataSource, SpeciesForm, SpeciesLookup } from '@pkm-rs/pkg'
import { Stats } from '../../util/types'
import {
  AllPKMs,
  PKMWithDVs,
  PKMWithGameBoyEVs,
  PKMWithModernEVs,
  PKMWithModernIVs,
  PKMWithNature,
} from './interfaces'

interface PKMWithStandardStats extends AllPKMs, PKMWithModernIVs, PKMWithModernEVs, PKMWithNature {}

interface PKMWithGameBoyStats extends AllPKMs, PKMWithDVs, PKMWithGameBoyEVs {}

export function getStats(
  mon: PKMWithStandardStats,
  metadataSource: MetadataSource = MetadataSource.ScarletViolet
): Stats {
  const speciesForm = SpeciesForm.tryNew(mon.nationalDex, mon.formIndex)
  return speciesForm
    ? calculateStats(
        speciesForm,
        mon.ivs,
        mon.evs,
        mon.getLevel(),
        mon.nature,
        mon.hyperTraining,
        metadataSource
      )
    : {
        hp: 0,
        atk: 0,
        def: 0,
        spe: 0,
        spa: 0,
        spd: 0,
      }
}

// TODO: game boy stat calculation
const getGameBoyPKMStats = (mon: PKMWithGameBoyStats): Stats => {
  if (mon.nationalDex < 1 || mon.nationalDex > NationalDexMax) {
    return {
      hp: 0,
      atk: 0,
      def: 0,
      spe: 0,
      spa: 0,
      spd: 0,
    }
  }

  // const level = getLevelGen12(mon.nationalDex, mon.exp)
  return {
    hp: 0,
    atk: 0,
    def: 0,
    spe: 0,
    spa: 0,
    spd: 0,
  }
}

export const getLevelGen12 = (nationalDex: number, exp: number) => {
  if (nationalDex > 251) {
    return 1
  }

  const levelUpType = SpeciesLookup(nationalDex)?.levelUpType

  for (let level = 100; level > 0; level--) {
    switch (levelUpType) {
      case 'Fast':
        if (Math.floor(0.8 * level ** 3) <= exp) {
          return level
        }

        break
      case 'Medium Fast':
        if (level ** 3 <= exp) {
          return level
        }

        break
      case 'Medium Slow':
        if (1.2 * level ** 3 - 15 * level ** 2 + 100 * level - 140 <= exp) {
          return level
        }

        break
      case 'Slow':
        if (Math.floor(1.25 * level ** 3) <= exp) {
          return level
        }

        break
    }
  }

  return 1
}
