/* eslint-disable no-nested-ternary */
import { PKM } from 'types/PKMTypes/PKM';
import { Stat } from 'types/types';
import { LevelUpExp, NDex, POKEMON_DATA, getNatureSummary } from '../consts';

export const getStatGen3Onward = (stat: Stat, mon: PKM) => {
  if (mon.dexNum < 1 || mon.dexNum > NDex.MAX) {
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
  }
  return 0;
};

export const getHPGen3Onward = (mon: PKM) => {
  if (mon.dexNum < 1 || mon.dexNum > NDex.MAX) {
    return 0;
  }
  if (mon.dexNum === NDex.SHEDINJA) {
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
  }
  return 0;
};

export const getLevelGen3Onward = (dexNum: number, exp: number) => {
  if (dexNum < 1 || dexNum > NDex.MAX) {
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
        if (Math.floor(0.8 * level ** 3) <= exp) {
          return level;
        }
        break;
      case 'Medium Fast':
        if (level ** 3 <= exp) {
          return level;
        }
        break;
      case 'Medium Slow':
        if (1.2 * level ** 3 - 15 * level ** 2 + 100 * level - 140 <= exp) {
          return level;
        }
        break;
      case 'Slow':
        if (Math.floor(1.25 * level ** 3) <= exp) {
          return level;
        }
        break;
    }
  }
  return 1;
};
