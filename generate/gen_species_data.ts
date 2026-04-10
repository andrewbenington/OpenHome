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
  megaEvolutionGetByBaseForm,
  type MegaEvolutionGetByBaseFormRow,
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
  readonly forms: readonly Form[]
  readonly levelUpType: LevelUpType
}

type Form = {
  readonly name: string
  readonly formName: string
  readonly formNumber: number
  readonly isBaseForm: boolean
  readonly isMega: boolean
  readonly megaEvolutionData: MegaEvolutionGetByBaseFormRow[]
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
  readonly evos?: readonly SpeciesAndForm[]
  readonly prevo?: SpeciesAndForm
  readonly eggGroups: readonly string[]
  readonly gen: number
  readonly regional?: RegionalForm
  readonly subLegendary: boolean
  readonly restrictedLegendary: boolean
  readonly ultraBeast: boolean
  readonly paradox: boolean
  readonly mythical: boolean
  readonly cosmeticForm: boolean
  readonly sprite: string
  readonly spriteIndex: readonly [number, number]
}

export type RegionalForm = 'Alola' | 'Galar' | 'Hisui' | 'Paldea'

type SpeciesAndForm = {
  readonly nationalDex: number
  readonly formIndex: number
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

function SpeciesAndFormToRust(ref: SpeciesAndForm): string {
  return `unsafe { SpeciesAndForm::new_unchecked(${ref.nationalDex}, ${ref.formIndex}) }`
}

function evolutionsToRust(evos?: readonly SpeciesAndForm[]): string {
  return `&[${(evos ?? []).map(SpeciesAndFormToRust).join(',')}]`
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
  return `GameSetting::${reg[0].toUpperCase()}${reg.slice(1)}`
}

function falseIfUndef(input?: boolean): boolean {
  return input === true
}

function convertForm(natDexIndex: number, form: Form): string {
  return `FormeMetadata {
    species_name: "${form.name}",
    national_dex: unsafe { NatDexIndex::new_unchecked(${natDexIndex}) },
    form_name: "${form.formName}",
    form_index: ${form.formNumber},
    is_base_form: ${form.isBaseForm},
    is_mega: ${falseIfUndef(form.isMega)},
    mega_evolution_data: &[${form.megaEvolutionData
      .map(
        (megaForm) =>
          `MegaEvolutionMetadata { mega_form: ${SpeciesAndFormToRust(megaForm)}, required_item_id: ${optionalToRust(megaForm.megaStoneId)} }`
      )
      .join(',')}],
    is_gmax: ${falseIfUndef(form.isGMax)},
    is_battle_only: ${falseIfUndef(form.isBattleOnly)},
    is_cosmetic: ${falseIfUndef(form.cosmeticForm)},
    types: (PkmType::${form.types[0]}, ${optionalToRust(form.types[1], pkmTypeToRust)}),
    gender_ratio: GenderRatio::${form.genderRatio},
    base_stats: ${statsToRust(form.baseStats)},
    abilities: (
      unsafe { AbilityIndex::new_unchecked(${form.ability1}) },
      unsafe { AbilityIndex::new_unchecked(${form.ability2 ?? form.ability1}) },
    ),
    hidden_ability: ${optionalToRust(form.abilityH, (val: number) => `unsafe { AbilityIndex::new_unchecked(${val}) }`)},
    base_height: ${form.height},
    base_weight: ${form.weight},
    evolutions: ${evolutionsToRust(form.evos)},
    pre_evolution: ${optionalToRust(form.prevo, SpeciesAndFormToRust)},
    egg_groups: (${eggGroupToRust(form.eggGroups[0])}, ${optionalToRust(form.eggGroups[1], eggGroupToRust)}),
    introduced: Generation::G${form.gen},
    is_restricted_legend: ${falseIfUndef(form.restrictedLegendary)},
    is_sub_legend: ${falseIfUndef(form.subLegendary)},
    is_mythical: ${falseIfUndef(form.mythical)},
    is_ultra_beast: ${falseIfUndef(form.ultraBeast)},
    is_paradox: ${falseIfUndef(form.paradox)},
    regional: ${optionalToRust(form.regional, regionToRust)},
    sprite: "${form.sprite}",
    sprite_index: (${form.spriteIndex}),
}`
}

function convertSpecies(species: Species): string {
  return `SpeciesMetadata {
    name: "${species.name}",
    national_dex: unsafe { NatDexIndex::new_unchecked(${species.nationalDex}) },
    level_up_type: ${levelUpTypeToRust(species.levelUpType)},
    forms: &[${species.forms.map((form) => convertForm(species.nationalDex, form)).join(',')}]
}`
}

function rowToSpecies(row: SpeciesGetAllRow, forms: Form[]): Species {
  return {
    name: row.name,
    nationalDex: row.nationalDex,
    levelUpType: row.levelUpType,
    forms: forms,
  }
}

function rowToForm(
  row: FormGetByNationalDexRow,
  evos: EvolutionsGetByPrevoRow[],
  prevo: EvolutionsGetByEvoRow | null,
  megas: MegaEvolutionGetByBaseFormRow[]
): Form {
  return {
    name: row.name,
    formName: row.displayName,
    formNumber: row.formIndex,
    isBaseForm: row.isBaseForm === 1,
    isMega: row.isMega === 1,
    megaEvolutionData: megas,
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
      nationalDex: evo.evoNationalDex,
      formIndex: evo.evoFormIndex,
    })),
    prevo: prevo
      ? {
          nationalDex: prevo.prevoNationalDex,
          formIndex: prevo.prevoFormIndex,
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
    cosmeticForm: false, // Placeholder
    sprite: row.spriteName,
    spriteIndex: [row.spriteRow, row.spriteCol],
  }
}

async function getAllSpeciesAndForms() {
  const db = new Database('generate/pkm.db')

  const speciesRows = camelcaseKeys(await speciesGetAll(db))
  const allSpecies: Species[] = []

  for (const species of speciesRows) {
    const formeRows = camelcaseKeys(await formGetByNationalDex(db, species.nationalDex))
    const speciesForms: Form[] = []
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
      const megas = camelcaseKeys(
        await megaEvolutionGetByBaseForm(db, {
          nationalDex: formeRow.nationalDex,
          baseFormIndex: formeRow.formIndex,
        })
      )
      speciesForms.push(rowToForm(formeRow, evolutions, preEvolution, megas))
    }
    const fullSpecies = rowToSpecies(species, speciesForms)
    allSpecies.push(fullSpecies)
  }

  return allSpecies
}

async function main() {
  const allSpecies: Species[] = await getAllSpeciesAndForms()

  let output = `
use crate::abilities::AbilityIndex;
use crate::species::{
    EggGroup, FormeMetadata, GenderRatio, LevelUpType, MegaEvolutionMetadata, NatDexIndex, SpeciesAndForm,
    SpeciesMetadata,
};
use pkm_rs_types::{Generation, PkmType, GameSetting, Stats16Le};

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

  const filename = 'pkm_rs_resources/src/species/metadata.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

await main()
