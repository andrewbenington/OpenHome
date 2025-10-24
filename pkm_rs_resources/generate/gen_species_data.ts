import Database from 'better-sqlite3'
import camelcaseKeys from 'camelcase-keys'
import * as fs from 'fs'
import {
  evolutionsGetByEvo,
  type EvolutionsGetByEvoRow,
  evolutionsGetByPrevo,
  type EvolutionsGetByPrevoRow,
  formGetByNationalDex,
  type FormGetByNationalDexRow,
  speciesGetAll,
  type SpeciesGetAllRow,
} from './queries.ts'

const abilityOverrides: Record<number, string> = {
  266: 'AS_ONE_ICE',
  267: 'AS_ONE_SHADOW',
  301: 'EMBODY_ASPECT_SPEED',
  302: 'EMBODY_ASPECT_SP_DEF',
  303: 'EMBODY_ASPECT_ATK',
  304: 'EMBODY_ASPECT_DEF',
}

export function rustAbilityConstName(index: number, ability: string): string {
  if (index in abilityOverrides) {
    return abilityOverrides[index]
  }

  let constName = ability
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')

  return constName
}

type LevelUpType = 'Slow' | 'Medium Slow' | 'Medium Fast' | 'Fast' | 'Erratic' | 'Fluctuating'

type GenderRatio =
  | 'Genderless'
  | 'AllMale'
  | 'AllFemale'
  | 'Equal'
  | 'M1ToF7'
  | 'M1ToF3'
  | 'M7ToF1'
  | 'M3ToF1'

type Species = {
  readonly name: string
  readonly nationalDex: number
  readonly formes: readonly Forme[]
  readonly levelUpType: LevelUpType
}

type Forme = {
  readonly name: string
  readonly formeName: string
  readonly formeNumber: number
  readonly isBaseForme: boolean
  readonly isMega: boolean
  readonly isGMax: boolean
  readonly isBattleOnly: boolean
  readonly alias: string
  readonly types: readonly string[]
  readonly genderRatio: GenderRatio
  readonly baseStats: {
    readonly hp: number
    readonly atk: number
    readonly def: number
    readonly spa: number
    readonly spd: number
    readonly spe: number
  }
  readonly ability1: number
  readonly ability2?: number
  readonly abilityH?: number
  readonly height: number
  readonly weight: number
  readonly evos?: readonly SpeciesAndForme[]
  readonly prevo?: SpeciesAndForme
  readonly eggGroups: readonly string[]
  readonly gen: number
  readonly regional?: RegionalForme
  readonly subLegendary: boolean
  readonly restrictedLegendary: boolean
  readonly ultraBeast: boolean
  readonly paradox: boolean
  readonly mythical: boolean
  readonly cosmeticForme: boolean
  readonly sprite: string
  readonly spriteIndex: readonly [number, number]
}

export type RegionalForme = 'Alola' | 'Galar' | 'Hisui' | 'Paldea'

type SpeciesAndForme = {
  readonly dexNumber: number
  readonly formeNumber: number
}

function statsToRust(stats: {
  readonly hp: number
  readonly atk: number
  readonly def: number
  readonly spa: number
  readonly spd: number
  readonly spe: number
}): string {
  return `Stats16Le::new(${stats.hp}, ${stats.atk}, ${stats.def}, ${stats.spa}, ${stats.spd}, ${stats.spe})`
}

function speciesAndFormeToRust(ref: SpeciesAndForme): string {
  return `unsafe { SpeciesAndForme::new_unchecked(${ref.dexNumber}, ${ref.formeNumber}) }`
}

function evolutionsToRust(evos?: readonly SpeciesAndForme[]): string {
  return `&[${(evos ?? []).map(speciesAndFormeToRust).join(',')}]`
}

function optionalToRust<T, S>(value: T | null | undefined, tranformer?: (T) => S): string {
  if (value !== undefined && value !== null) {
    return `Some(${tranformer ? tranformer(value) : value})`
  } else {
    return 'None'
  }
}

function pkmTypeToRust(pt: string): string {
  return `PkmType::${pt}`
}

function eggGroupToRust(eg: string): string {
  const enumName =
    eg === 'Undiscovered' ? 'NoEggsDiscovered' : eg.split(' ').join('').split('-').join('')
  return `EggGroup::${enumName}`
}

function levelUpTypeToRust(lut: string): string {
  return `LevelUpType::${lut.split(' ').join('')}`
}

function regionToRust(reg: string): string {
  return `Region::${reg[0].toUpperCase()}${reg.slice(1)}`
}

function falseIfUndef(input?: boolean): boolean {
  return input === true
}

function convertForme(natDexIndex: number, forme: Forme): string {
  return `FormeMetadata {
    species_name: "${forme.name}",
    national_dex: unsafe { NatDexIndex::new_unchecked(${natDexIndex}) },
    forme_name: "${forme.formeName}",
    forme_index: ${forme.formeNumber},
    is_base_forme: ${forme.isBaseForme},
    is_mega: ${falseIfUndef(forme.isMega)},
    is_gmax: ${falseIfUndef(forme.isGMax)},
    is_battle_only: ${falseIfUndef(forme.isBattleOnly)},
    is_cosmetic: ${falseIfUndef(forme.cosmeticForme)},
    types: (PkmType::${forme.types[0]}, ${optionalToRust(forme.types[1], pkmTypeToRust)}),
    gender_ratio: GenderRatio::${forme.genderRatio},
    base_stats: ${statsToRust(forme.baseStats)},
    abilities: (
      unsafe { AbilityIndex::new_unchecked(${forme.ability1}) },
      unsafe { AbilityIndex::new_unchecked(${forme.ability2 ?? forme.ability1}) },
    ),
    hidden_ability: ${optionalToRust(forme.abilityH, (val: number) => `unsafe { AbilityIndex::new_unchecked(${val}) }`)},
    base_height: ${forme.height},
    base_weight: ${forme.weight},
    evolutions: ${evolutionsToRust(forme.evos)},
    pre_evolution: ${optionalToRust(forme.prevo, speciesAndFormeToRust)},
    egg_groups: (${eggGroupToRust(forme.eggGroups[0])}, ${optionalToRust(forme.eggGroups[1], eggGroupToRust)}),
    introduced: Generation::G${forme.gen},
    is_restricted_legend: ${falseIfUndef(forme.restrictedLegendary)},
    is_sub_legend: ${falseIfUndef(forme.subLegendary)},
    is_mythical: ${falseIfUndef(forme.mythical)},
    is_ultra_beast: ${falseIfUndef(forme.ultraBeast)},
    is_paradox: ${falseIfUndef(forme.paradox)},
    regional: ${optionalToRust(forme.regional, regionToRust)},
    sprite: "${forme.sprite}",
    sprite_index: (${forme.spriteIndex}),
}`
}

function prependStaticRef(input: string) {
  return `&${input}`
}

function convertSpecies(species: Species): string {
  return `SpeciesMetadata {
    name: "${species.name}",
    national_dex: unsafe { NatDexIndex::new_unchecked(${species.nationalDex}) },
    level_up_type: ${levelUpTypeToRust(species.levelUpType)},
    formes: &[${species.formes.map((forme) => convertForme(species.nationalDex, forme)).join(',')}]
}`
}

function rowToSpecies(row: SpeciesGetAllRow, forms: Forme[]): Species {
  return {
    name: row.name,
    nationalDex: row.nationalDex,
    levelUpType: row.levelUpType,
    formes: forms,
  }
}

function rowToForm(
  row: FormGetByNationalDexRow,
  evos: EvolutionsGetByPrevoRow[],
  prevo: EvolutionsGetByEvoRow | null
): Forme {
  return {
    name: row.name,
    formeName: row.displayName,
    formeNumber: row.formIndex,
    isBaseForme: row.isBaseForm === 1,
    isMega: row.isMega === 1,
    isGMax: row.isGmax === 1,
    isBattleOnly: row.isBattleOnly === 1,
    alias: '', // Placeholder
    types: [row.type1, row.type2].filter(Boolean) as string[],
    genderRatio: row.genderRatio,
    baseStats: {
      hp: row.baseHp,
      atk: row.baseAttack,
      def: row.baseDefense,
      spa: row.baseSpecialAttack,
      spd: row.baseSpecialDefense,
      spe: row.baseSpeed,
    },
    ability1: row.ability1,
    ability2: row.ability2 || undefined,
    abilityH: row.abilityHidden || undefined,
    height: row.heightDecimeters,
    weight: row.weightHectograms,
    evos: evos.map((evo) => ({
      dexNumber: evo.evoNationalDex,
      formeNumber: evo.evoFormIndex,
    })),
    prevo: prevo
      ? {
          dexNumber: prevo.prevoNationalDex,
          formeNumber: prevo.prevoFormIndex,
        }
      : undefined,
    eggGroups: [row.eggGroup1, row.eggGroup2].filter(Boolean) as string[],
    gen: row.introducedGen,
    regional: row.regional || undefined,
    subLegendary: row.isSublegendary === 1,
    restrictedLegendary: row.isRestrictedLegendary === 1,
    ultraBeast: row.isUltraBeast === 1,
    paradox: row.isParadox === 1,
    mythical: row.isMythical === 1,
    cosmeticForme: false, // Placeholder
    sprite: row.spriteName,
    spriteIndex: [row.spriteRow, row.spriteCol],
  }
}

async function getAllSpeciesAndFormes() {
  const db = new Database('generate/pkm.db')

  const speciesRows = camelcaseKeys(await speciesGetAll(db))
  const allSpecies: Species[] = []

  for (const species of speciesRows) {
    console.log(species)
    const formeRows = camelcaseKeys(await formGetByNationalDex(db, species.nationalDex))
    const speciesForms: Forme[] = []
    for (const formeRow of formeRows) {
      const evolutions = camelcaseKeys(
        await evolutionsGetByPrevo(db, {
          prevoNationalDex: formeRow.nationalDex,
          prevoFormIndex: formeRow.formIndex,
        })
      )
      const preEvolution = camelcaseKeys(
        await evolutionsGetByEvo(db, {
          evoNationalDex: formeRow.nationalDex,
          evoFormIndex: formeRow.formIndex,
        })
      )
      speciesForms.push(rowToForm(formeRow, evolutions, preEvolution))
    }
    const fullSpecies = rowToSpecies(species, speciesForms)
    allSpecies.push(fullSpecies)
  }

  return allSpecies
}

async function main() {
  const allSpecies: Species[] = await getAllSpeciesAndFormes()

  let output = `
use crate::abilities::AbilityIndex;
use crate::species::{
    EggGroup, FormeMetadata, GenderRatio, LevelUpType, NatDexIndex, SpeciesAndForme,
    SpeciesMetadata,
};
use pkm_rs_types::{Generation, PkmType, Region, Stats16Le};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const NATIONAL_DEX_MAX: usize = ${allSpecies.length};

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn all_species_data() -> Vec<SpeciesMetadata> {
    ALL_SPECIES.clone().into_iter().collect()
}

  `

  output +=
    `pub static ALL_SPECIES: [SpeciesMetadata; NATIONAL_DEX_MAX] = [\n` +
    allSpecies.map(convertSpecies).join(',\n') +
    '];'

  const filename = 'src/species/metadata.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

await main()
