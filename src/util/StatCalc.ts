import LevelUpExp from '../consts/LevelUpExp';
import { POKEMON_DATA } from '../consts/Mons';
import { getNatureSummary } from '../consts/Natures';
import { PKM } from '../types/PKMTypes/PKM';
import { Stat } from '../types/types';

export const getStatGen3Onward = (stat: Stat, mon: PKM) => {
  if (mon.dexNum < 1 || mon.dexNum > 1010) {
    return 0;
  }
  const natureSummary = getNatureSummary(mon.nature);
  const natureMultiplier = natureSummary?.includes(`+${stat}`)
    ? 1.1
    : natureSummary?.includes(`-${stat}`)
    ? 0.9
    : 1;
  const baseStats = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.baseStats;
  if (baseStats) {
    const baseStat = (baseStats as any)[stat.toLowerCase()];
    const iv = (mon.ivs as any)[stat.toLowerCase()];
    const ev = (mon.evs as any)[stat.toLowerCase()];
    return Math.floor(
      natureMultiplier *
        (Math.floor(
          (mon.level * (2 * baseStat + iv + Math.floor(ev / 4))) / 100
        ) +
          5)
    );
  } else {
    return 0;
  }
};

export const getHPGen3Onward = (mon: PKM) => {
  if (mon.dexNum < 1 || mon.dexNum > 1010) {
    return 0;
  }
  if (mon.dexNum === 292) {
    // shedinja
    return 1;
  }
  const baseHP = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum]?.baseStats?.hp;
  if (baseHP) {
    const iv = (mon.ivs as any).hp;
    const ev = (mon.evs as any).hp;
    return (
      Math.floor((mon.level * (2 * baseHP + iv + Math.floor(ev / 4))) / 100) +
      mon.level +
      10
    );
  } else {
    return 0;
  }
};

export const getLevelGen3Onward = (dexNum: number, exp: number) => {
  if (dexNum < 1 || dexNum > 1010) {
    return 1;
  }
  if (dexNum === 0) {
    return 1;
  }
  const levelUpType = POKEMON_DATA[dexNum].levelUpType;
  const cutoffList = LevelUpExp[levelUpType];
  return cutoffList.findIndex((minExp) => exp <= minExp) + 1;
};

export const getLevelGen12 = (dexNum: number, exp: number) => {
  if (dexNum > 251) {
    return 1;
  }
  const levelUpType = POKEMON_DATA[dexNum].levelUpType;
  for (let level = 100; level > 0; level--) {
    switch (levelUpType) {
      case 'Fast':
        if (Math.floor(0.8 * Math.pow(level, 3)) <= exp) {
          return level;
        }
        break;
      case 'Medium Fast':
        if (Math.pow(level, 3) <= exp) {
          return level;
        }
        break;
      case 'Medium Slow':
        if (
          1.2 * Math.pow(level, 3) -
            15 * Math.pow(level, 2) +
            100 * level -
            140 <=
          exp
        ) {
          return level;
        }
        break;
      case 'Slow':
        if (Math.floor(1.25 * Math.pow(level, 3)) <= exp) {
          return level;
        }
        break;
    }
  }
  return 1;
};
