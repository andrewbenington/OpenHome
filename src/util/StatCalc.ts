import { LevelUpExp } from '@pokemon-files/util'
import { getNatureSummary } from 'pokemon-resources'
import { NationalDex, NationalDexMax, PokemonData } from 'pokemon-species-data'
import { PKMInterface } from '../types/interfaces'
import { Stat } from '../types/types'

export const getStatGen3Onward = (stat: Stat, mon: PKMInterface) => {
  if (!('ivs' in mon) || mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return 0
  }
  const natureSummary = getNatureSummary(mon.nature)
  const natureMultiplier = natureSummary?.includes(`+${stat}`)
    ? 1.1
    : natureSummary?.includes(`-${stat}`)
      ? 0.9
      : 1
  const baseStats = PokemonData[mon.dexNum]?.formes[mon.formeNum]?.baseStats

  if (baseStats) {
    const baseStat = (baseStats as any)[stat.toLowerCase()]
    const iv = (mon.ivs as any)[stat.toLowerCase()]
    const ev = (mon.evs as any)[stat.toLowerCase()]

    return Math.floor(
      natureMultiplier *
        (Math.floor((mon.getLevel() * (2 * baseStat + iv + Math.floor(ev / 4))) / 100) + 5)
    )
  }
  return 0
}

export const getHPGen3Onward = (mon: PKMInterface) => {
  if (!('ivs' in mon) || mon.dexNum < 1 || mon.dexNum > NationalDexMax) {
    return 0
  }
  if (mon.dexNum === NationalDex.Shedinja) {
    return 1
  }
  const baseHP = PokemonData[mon.dexNum]?.formes[mon.formeNum]?.baseStats?.hp

  if (baseHP) {
    const iv = (mon.ivs as any).hp
    const ev = (mon.evs as any).hp

    return (
      Math.floor((mon.getLevel() * (2 * baseHP + iv + Math.floor(ev / 4))) / 100) +
      mon.getLevel() +
      10
    )
  }
  return 0
}

export const getLevelGen3Onward = (dexNum: number, exp: number) => {
  if (dexNum < 1 || dexNum > NationalDexMax) {
    return 1
  }
  const levelUpType = PokemonData[dexNum].levelUpType
  const cutoffList = LevelUpExp[levelUpType]

  return cutoffList.findIndex((minExp) => exp <= minExp) + 1
}

export const getLevelGen12 = (dexNum: number, exp: number) => {
  if (dexNum > 251) {
    return 1
  }
  const levelUpType = PokemonData[dexNum].levelUpType

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
