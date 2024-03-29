import { Pokemon } from '../types/types'
import masterPokemon from './JSON/Pokemon.json'

const monData = masterPokemon as unknown as { [key: string]: Pokemon }

const nDex: { [key: string]: number } = {}
const families: number[] = Object.values(monData)
  .filter((monData) => !monData.formes[0].prevo)
  .map((monData) => monData.nationalDex)
const formes: { [key: string]: any } = {}

export const MonFamilies = families
export const MonFormes = formes
export const NationalDex = nDex

export const SUB_LEGENDS = Object.values(monData)
  .filter((mon) => mon.formes[0].subLegendary)
  .map((mon) => mon.name)
export const RESTRICTED_LEGENDS = Object.values(monData)
  .filter((mon) => mon.formes[0].restrictedLegendary)
  .map((mon) => mon.name)

export const POKEMON_DATA = monData
