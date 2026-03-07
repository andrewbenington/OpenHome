export type MilestoneId = string
export type RewardId = string

export type DexSnapshot = {
  national_unique_species: number
  national_species_present: Set<number>
  regional_completion: Record<string, number> // regionId -> completion percentage
  /** Count of Pokémon currently in vault grouped by type. */
  type_counts: Record<string, number>
  /** Count of shiny Pokémon currently in vault. */
  shiny_count: number
}

/** Level definition for progressive milestones (e.g., catch 5, then 10, then 20) */
export type MilestoneLevel = {
  target_count: number
  reward_id: RewardId
}

export type MilestoneDefinition = {
  id: MilestoneId
  name: string
  description: string
  kind: "national_living_dex" | "regional_dex_100" | "national_dex_threshold" | "type_count" | "type_count_progressive" | "shiny_count"
  required_species?: number[] // for national living dex
  region_id?: string // for regional dex 100
  national_threshold?: number // for national dex threshold milestones
  target_type?: string // for type count
  target_count?: number // for count-based milestones
  levels?: MilestoneLevel[] // for progressive milestones (type_count_progressive, etc.)
  reward_id: RewardId
}

export type RewardDefinition = {
  id: RewardId
  name: string
  description: string
  species_id: number
  is_shiny: boolean
  source_tag: string
}

export type ProgressionState = {
  version: 1
  completed_milestones: Record<MilestoneId, true>
  granted_rewards: Record<RewardId, true>
  reward_history: Array<{
    reward_id: RewardId
    milestone_id: MilestoneId
    granted_at_iso: string
  }>
  /** Historical set of all Pokémon types ever deposited. Only grows, never shrinks. */
  types_ever_deposited: Record<string, true>
  /** Track current level (0-indexed) for each progressive milestone. */
  progressive_milestone_levels: Record<MilestoneId, number>
}