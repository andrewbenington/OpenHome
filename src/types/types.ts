import { pa8 } from "../pkm/pa8";
import { pb7 } from "../pkm/pb7";
import { pk3 } from "../pkm/pk3";
import { pk4 } from "../pkm/pk4";
import { pk5 } from "../pkm/pk5";
import { pk6 } from "../pkm/pk6";
import { pk7 } from "../pkm/pk7";
import { pk8 } from "../pkm/pk8";
import { pk9 } from "../pkm/pk9";
import { pkm } from "../pkm/pkm";

export type Dictionary = { [index: string]: any };
export type Stat = "HP" | "Atk" | "Def" | "SpA" | "SpD" | "Spe" | "Sp"
export type Type =
  | "Fire"
  | "Grass"
  | "Electric"
  | "Ghost"
  | "Fairy"
  | "Water"
  | "Ice"
  | "Rock"
  | "Ground"
  | "Flying"
  | "Fighting"
  | "Psychic"
  | "Dark"
  | "Bug"
  | "Steel"
  | "Poison"
  | "Dragon"
  | "Normal";
export type pokemon = pkm | pk3 | pk4 | pk5 | pk6 | pk7 | pb7 | pk8 | pa8 | pk9;

export type RegionalForme = "Alola" | "Galar" | "Hisui" | "Paldea";
export type Pokemon = {
  name: string;
  nationalDex: number;
  formes: Forme[];
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
};

export type Move = {
  name: string;
  accuracy?: number;
  class: "physical" | "status" | "special";
  generation: string;
  power?: number;
  pp?: number;
  type: string;
  id: number;
};
