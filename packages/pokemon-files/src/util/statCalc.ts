import { getNatureSummary } from 'pokemon-resources'
import { NationalDex, NationalDexMax } from 'pokemon-species-data'

import { PKM } from '../pkm'

import { MetadataLookup, SpeciesLookup } from '@pokemon-resources/pkg'
import {
  AllPKMs,
  PKMWithDVs,
  PKMWithGameBoyEVs,
  PKMWithModernEVs,
  PKMWithModernIVs,
  PKMWithNature,
  SpeciesData,
} from './interfaces'
import { Stat } from './types'

export interface PKMWithStandardStats
  extends AllPKMs,
    PKMWithModernIVs,
    PKMWithModernEVs,
    PKMWithNature {}

export interface PKMWithStandardStatCalc
  extends SpeciesData,
    PKMWithModernIVs,
    PKMWithModernEVs,
    PKMWithNature {}

export interface PKMWithGameBoyStats extends AllPKMs, PKMWithDVs, PKMWithGameBoyEVs {}

export function getStats(mon: PKM) {
  switch (mon.format) {
    case 'PK1':
    case 'PK2':
      return getGameBoyPKMStats(mon)
    case 'PK3':
    case 'COLOPKM':
    case 'XDPKM':
    case 'PK4':
    case 'PK5':
    case 'PK6':
    case 'PK7':
    case 'PK8':
    case 'PA8':
    case 'PK9':
      return getStandardPKMStats(mon)
    default:
      return { hp: 0, atk: 0, def: 0, spe: 0, spa: 0, spd: 0 }
  }
}

export const getStandardPKMStats = (mon: PKMWithStandardStats) => {
  if (mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return {
      hp: 0,
      atk: 0,
      def: 0,
      spe: 0,
      spa: 0,
      spd: 0,
    }
  }

  const level = SpeciesLookup(mon.dexNum)?.calculateLevel(mon.exp) ?? 0

  return {
    hp: getHPGen3Onward(mon, level),
    atk: getStatGen3Onward(mon, 'atk', level),
    def: getStatGen3Onward(mon, 'def', level),
    spe: getStatGen3Onward(mon, 'spe', level),
    spa: getStatGen3Onward(mon, 'spa', level),
    spd: getStatGen3Onward(mon, 'spd', level),
  }
}

export const getGameBoyPKMStats = (mon: PKMWithGameBoyStats) => {
  if (mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return {
      hp: 0,
      atk: 0,
      def: 0,
      spe: 0,
      spa: 0,
      spd: 0,
    }
  }

  // const level = getLevelGen12(mon.dexNum, mon.exp)
  return {
    hp: 0,
    atk: 0,
    def: 0,
    spe: 0,
    spa: 0,
    spd: 0,
  }
}

export const getStatGen3Onward = (mon: PKMWithStandardStatCalc, stat: Stat, level: number) => {
  if (mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return 0
  }

  const natureSummary = getNatureSummary(mon.nature)
  const natureMultiplier = natureSummary?.toLowerCase().includes(`+${stat}`)
    ? 1.1
    : natureSummary?.toLowerCase().includes(`-${stat}`)
      ? 0.9
      : 1
  const baseStats = MetadataLookup(mon.dexNum, mon.formeNum)?.baseStats

  if (baseStats) {
    const baseStat = baseStats[stat]
    const iv = mon.ivs[stat]
    const ev = mon.evs[stat]

    return Math.floor(
      natureMultiplier * (Math.floor((level * (2 * baseStat + iv + Math.floor(ev / 4))) / 100) + 5)
    )
  }

  return 0
}

export const getHPGen3Onward = (mon: PKMWithStandardStatCalc, level: number) => {
  if (mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return 0
  }

  if (mon.dexNum === NationalDex.Shedinja) {
    return 1
  }

  const baseHP = MetadataLookup(mon.dexNum, mon.formeNum)?.baseStats?.hp

  if (baseHP) {
    const iv = mon.ivs.hp
    const ev = mon.evs.hp

    return Math.floor((level * (2 * baseHP + iv + Math.floor(ev / 4))) / 100) + level + 10
  }

  return 0
}

export const getLevelGen12 = (dexNum: number, exp: number) => {
  if (dexNum > 251) {
    return 1
  }

  const levelUpType = SpeciesLookup(dexNum)?.levelUpType

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
