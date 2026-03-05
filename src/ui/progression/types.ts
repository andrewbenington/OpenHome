export type MilestoneId = string
export type RewardId = string

export type DexSnapshot = {
  national_unique_species: number
  national_species_present: Set<number>
}

export type MilestoneDefinition = {
  id: MilestoneId
  name: string
  description: string
  kind: "national_living_dex"
  required_species: number[]
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
}