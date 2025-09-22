import * as fs from 'fs'

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
  readonly genderRatio: { readonly M: number; readonly F: number }
  readonly baseStats: {
    readonly hp: number
    readonly atk: number
    readonly def: number
    readonly spa: number
    readonly spd: number
    readonly spe: number
  }
  readonly ability1: string
  readonly ability2?: string
  readonly abilityH?: string
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

const ability_names: string[] = fs
  .readFileSync('text_source/abilities.txt', 'utf-8')
  .split('\n')
  .map((val) => val.replaceAll('’', ''))

function getAbilityIndex(name: string) {
  const constName = rustAbilityConstName(0, name)
  if (Object.values(abilityOverrides).includes(constName)) {
    const [index] = Object.entries(abilityOverrides).find(
      ([idx, abilityName]) => abilityName === constName
    )
    return parseInt(index)
  }

  const index = ability_names.indexOf(name.replaceAll('’', '').replaceAll("'", ''))
  if (index < 1) {
    throw new Error(`Ability not found: ${name}`)
  }
  return index
}

export type RegionalForme = 'Alola' | 'Galar' | 'Hisui' | 'Paldea'

type SpeciesAndForme = {
  readonly dexNumber: number
  readonly formeNumber: number
}

function rustFormeConstName(forme: Forme): string {
  const formeName =
    forme.formeName === forme.name && forme.isBaseForme
      ? forme.formeName + '-base'
      : forme.formeName
  let constName = formeName
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')

  return constName
}

function rustSpeciesConstName(species: Species): string {
  let constName = species.name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')

  return constName
}

function genderRatioToRust(gr: { readonly M: number; readonly F: number }): string {
  switch (gr.M) {
    case 0.0:
      return gr.F === 0 ? 'GenderRatio::Genderless' : 'GenderRatio::AllFemale'
    case 0.125:
      return 'GenderRatio::M1ToF7'
    case 0.25:
      return 'GenderRatio::M1ToF3'
    case 0.5:
      return 'GenderRatio::Equal'
    case 0.75:
      return 'GenderRatio::M3ToF1'
    case 0.875:
      return 'GenderRatio::M7ToF1'
    case 1:
      return 'GenderRatio::AllMale'
    default:
      throw new Error(`UNKNOWN GENDER RATIO: ${JSON.stringify(gr)}`)
  }
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

function map<T, S>(input: T | null | undefined, f: (T) => S): S | null | undefined {
  if (input === undefined) return undefined
  if (input === null) return null

  return f(input)
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

function abilityConstName(forme: Forme, ability: string) {
  if (ability === 'As One') {
    return rustAbilityConstName(forme.formeName.includes('Ice-Rider') ? 266 : 267, 'As One')
  }
  if (ability === 'Embody Aspect') {
    return rustAbilityConstName(301 + forme.formeNumber, 'Embody Aspect')
  }
  return rustAbilityConstName(0, ability)
}

function falseIfUndef(input?: boolean): boolean {
  return input === true
}

function convertForme(natDexIndex: number, forme: Forme): string {
  const constName = rustFormeConstName(forme)

  console.log('forme:', constName)
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
    gender_ratio: ${genderRatioToRust(forme.genderRatio)},
    base_stats: ${statsToRust(forme.baseStats)},
    abilities: (
      unsafe { AbilityIndex::new_unchecked(${getAbilityIndex(forme.ability1)}) },
      unsafe { AbilityIndex::new_unchecked(${getAbilityIndex(forme.ability2 ?? forme.ability1)}) },
    ),
    hidden_ability: ${optionalToRust(forme.abilityH, (val: string) => `unsafe { AbilityIndex::new_unchecked(${getAbilityIndex(val)}) }`)},
    base_height: ${forme.height}f32,
    base_weight: ${forme.weight}f32,
    evolutions: ${evolutionsToRust(forme.evos)},
    pre_evolution: ${optionalToRust(forme.prevo, speciesAndFormeToRust)},
    egg_groups: (${eggGroupToRust(forme.eggGroups[0])}, ${optionalToRust(forme.eggGroups[1], eggGroupToRust)}),
    introduced: Generation::G${forme.gen},
    is_restricted_legend: ${falseIfUndef(forme.restrictedLegendary)},
    is_sub_legend: ${falseIfUndef(forme.subLegendary)},
    is_mythical: ${falseIfUndef(forme.mythical)},
    is_ultra_beast: ${falseIfUndef(forme.ultraBeast)},
    is_paradox: ${falseIfUndef(forme.paradox)},
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

function main() {
  console.log(process.cwd())
  const speciesJson: Record<string, Species> = JSON.parse(
    fs.readFileSync('text_source/species.json', 'utf-8')
  )

  let output = `
use crate::resources::{AbilityIndex, EggGroup, FormeMetadata, GenderRatio, LevelUpType, NatDexIndex, SpeciesAndForme, SpeciesMetadata };
use crate::resources::{games::Generation, pkm_types::PkmType};
use crate::substructures::Stats16Le;

pub const NATIONAL_DEX_MAX: usize = ${Object.keys(speciesJson).length};

  `

  // const allFormes = Object.values(speciesJson).map(species => species.formes.map(forme => [species.nationalDex, forme])).flat() as [number, Forme][]

  // output += allFormes
  //   .map(([nationalDex, forme]) => convertForme(nationalDex, forme))
  //   .join("\n\n");

  // output += Object.values(speciesJson)
  //   .map(convertSpecies)
  //   .join("\n\n");

  output +=
    `pub static ALL_SPECIES: [SpeciesMetadata; NATIONAL_DEX_MAX] = [\n` +
    Object.values(speciesJson).map(convertSpecies).join(',\n') +
    '];'

  const filename = 'src/resources/species/metadata.rs'
  fs.writeFileSync(filename, output)
  console.log(`Rust code written to ${filename}`)
}

main()
