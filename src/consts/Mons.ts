import masterPokemon from "./MasterPokemon.json";
import { Pokemon } from "../renderer/types/types";

const monData = masterPokemon as unknown as { [key: string]: Pokemon };

const nDex: { [key: string]: number } = {};
let families: number[] = Object.values(monData)
  .filter((monData) => !monData["formes"][0].prevo)
  .map(monData => monData.nationalDex);
let formes: { [key: string]: any } = {};

export const MonFamilies = families;
export const MonFormes = formes;
export const NationalDex = nDex;

export const SUB_LEGENDS = Object.values(monData)
  .filter((mon) => mon["formes"][0].subLegendary)
  .map((mon) => mon.name);
export const RESTRICTED_LEGENDS = Object.values(monData)
  .filter((mon) => mon["formes"][0].restrictedLegendary)
  .map((mon) => mon.name);

export const MONS_LIST = monData;
