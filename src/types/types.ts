export type Dictionary = { [index: string]: any };
export type Stat = 'HP' | 'Atk' | 'Def' | 'SpA' | 'SpD' | 'Spe' | 'Sp';
export type Type =
  | 'Fire'
  | 'Grass'
  | 'Electric'
  | 'Ghost'
  | 'Fairy'
  | 'Water'
  | 'Ice'
  | 'Rock'
  | 'Ground'
  | 'Flying'
  | 'Fighting'
  | 'Psychic'
  | 'Dark'
  | 'Bug'
  | 'Steel'
  | 'Poison'
  | 'Dragon'
  | 'Normal';
export type levelUpType =
  | 'Slow'
  | 'Medium Slow'
  | 'Medium Fast'
  | 'Fast'
  | 'Erratic'
  | 'Fluctuating';

export enum SaveType {
  UNKNOWN,
  RBY_I,
  GS_I,
  C_I,
  C_J,
  RS,
  FRLG,
  E,
  DP,
  Pt,
  HGSS,
  G5,
}

export type RegionalForme = 'Alola' | 'Galar' | 'Hisui' | 'Paldea';
export type Pokemon = {
  name: string;
  nationalDex: number;
  formes: Forme[];
  levelUpType: levelUpType;
};

export type Origin = {
  name: string;
  mark?: string;
  region?: string;
  logo?: string;
  gc?: number;
};

export type MonReference = { dexNumber: number; formeNumber: number };

export type Forme = {
  name: string;
  formeName: string;
  formeNumber: number;
  isBaseForme: boolean;
  isMega: boolean;
  isGMax: boolean;
  isBattleOnly: boolean;
  alias: string;
  types: Type[];
  genderRatio: { M: number; F: number };
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  ability1: string;
  ability2?: string;
  abilityH?: string;
  height: number;
  weight: number;
  evos: MonReference[];
  prevo?: MonReference;
  eggGroups: string[];
  gen: number;
  regional?: RegionalForme;
  subLegendary: boolean;
  restrictedLegendary: boolean;
  ultraBeast: boolean;
  paradox: boolean;
  mythical: boolean;
  sprite: string;
  spriteIndex: [number, number];
};

export type Move = {
  name: string;
  accuracy?: number;
  class: 'physical' | 'status' | 'special';
  generation: string;
  power?: number;
  pp: number;
  pastGenPP: {
    G1?: number;
    G2?: number;
    G3?: number;
    G4?: number;
    G5?: number;
    G6?: number;
    SMUSUM?: number;
    LGPE?: number;
    G8?: number;
  };
  type: string;
  id: number;
};
