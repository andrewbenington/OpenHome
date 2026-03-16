import * as fs from "fs";
import { UnboundToNationalDexMap } from "../../src/core/save/unbound/conversion/UnboundSpeciesMap";


type GameStats = {
  baseHP: number
  baseAttack: number
  baseDefense: number
  baseSpAttack: number
  baseSpDefense: number
  baseSpeed: number
  type1: string
  type2?: string
  genderRatio?: string
  ability1?: string
  ability2?: string
  hiddenAbility?: string
  growthRate?: string
}

type NationalForm = {
  types: string[]
  genderRatio?: { M: number; F: number }
  baseStats: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
  ability1?: string
  ability2?: string
  abilityH?: string
}

type NationalDexEntry = {
  formes: NationalForm[]
  levelUpType?: string
}

const statMap: Record<string, keyof NationalForm["baseStats"]> = {
  baseHP: "hp",
  baseAttack: "atk",
  baseDefense: "def",
  baseSpAttack: "spa",
  baseSpDefense: "spd",
  baseSpeed: "spe",
}

function normalizeType(type?: string) {
  if (!type) return undefined
  return type.replace("TYPE_", "").toLowerCase().replace(/^./, c => c.toUpperCase())
}

function normalizeAbility(ability?: string) {
  if (!ability || ability === "ABILITY_NONE") return undefined

  return ability
    .replace("ABILITY_", "")
    .toLowerCase()
    .replace(/\s+/g, "")
}

function normalizeAbilityCompare(a?: string) {
  if (!a) return undefined
  return a.toLowerCase().replace(/\s+/g, "")
}

function normalizeAbilitySet(a1?: string, a2?: string, ah?: string) {
  const n1 = normalizeAbilityCompare(a1)
  const n2 = normalizeAbilityCompare(a2)
  const nh = normalizeAbilityCompare(ah)

  // If only one ability exists, treat all as the same
  if (!n2 && !nh) {
    return {
      ability1: n1,
      ability2: n1,
      abilityH: n1
    }
  }

  return {
    ability1: n1,
    ability2: n2 ?? n1,
    abilityH: nh ?? n1
  }
}

function normalizeGrowthRate(rate?: string) {
  if (!rate) return undefined

  return rate
    .replace("GROWTH_", "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function parseGenderRatio(r?: string) {
  if (!r) return undefined

  const match = r.match(/PERCENT_FEMALE\(([\d.]+)\)/)
  if (!match) return undefined

  const f = parseFloat(match[1]) / 100
  const m = 1 - f

  return { M: m, F: f }
}

function diff(a: any, b: any) {
  return JSON.stringify(a) !== JSON.stringify(b)
}

export function createDelta(
  gameData: Record<string, GameStats>,
  nationalData: Record<string, NationalDexEntry>
) {
  const delta: Record<string, any> = {}

  for (const gameIndex in gameData) {
    const mapping = UnboundToNationalDexMap[gameIndex]
    if (!mapping) continue

    const nat = nationalData[String(mapping.NationalDexIndex)]
    if (!nat) continue

    const form = nat.formes[mapping.FormIndex]
    if (!form) continue

    const game = gameData[gameIndex]
    const changes: any = {}

    // stats
    for (const gStat in statMap) {
      const nStat = statMap[gStat]
      const gVal = (game as any)[gStat]
      const nVal = form.baseStats[nStat]

      if (diff(gVal, nVal)) {
        changes[nStat] = gVal
      }
    }

    // types
    const gType1 = normalizeType(game.type1)
    const gType2 = normalizeType(game.type2)

    const gTypes = gType2 && gType2 !== gType1 ? [gType1, gType2] : [gType1]

    if (diff(gTypes, form.types)) {
      changes.types = gTypes
    }

    // abilities
    const gAbility1 = normalizeAbility(game.ability1)
    const gAbility2 = normalizeAbility(game.ability2)
    const gAbilityH = normalizeAbility(game.hiddenAbility)

    const gSet = normalizeAbilitySet(gAbility1, gAbility2, gAbilityH)
    const nSet = normalizeAbilitySet(form.ability1, form.ability2, form.abilityH)

    if (gSet.ability1 !== nSet.ability1) changes.ability1 = gAbility1
    if (gSet.ability2 !== nSet.ability2) changes.ability2 = gAbility2
    if (gSet.abilityH !== nSet.abilityH) changes.abilityH = gAbilityH

    // gender ratio
    const gGender = parseGenderRatio(game.genderRatio)
    if (diff(gGender, form.genderRatio)) {
      changes.genderRatio = gGender
    }

    // growth rate / level up type
    const gGrowth = normalizeGrowthRate(game.growthRate)

    if (diff(gGrowth, nat.levelUpType)) {
      changes.levelUpType = gGrowth
    }

    if (Object.keys(changes).length > 0) {
      const key = `${mapping.NationalDexIndex}_${mapping.FormIndex}`
      delta[key] = changes
    }
  }

  return delta
}

// example usage
const gameData = JSON.parse(fs.readFileSync("./unbound/SpeciesStats.json", "utf8"))
const nationalData = JSON.parse(fs.readFileSync("../../pkm_rs_resources/text_source/species.json", "utf8"))

const delta = createDelta(gameData, nationalData)

fs.writeFileSync("unbound/SpeciesDataDelta.json", JSON.stringify(delta, null, 2))