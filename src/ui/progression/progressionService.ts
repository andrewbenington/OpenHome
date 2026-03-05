import { OHPKM } from "@openhome-core/pkm/OHPKM"
import type { DexSnapshot, MilestoneDefinition, ProgressionState, RewardDefinition } from "./types"

export function compute_dex_snapshot(all_stored: OHPKM[]): DexSnapshot {
  const present = new Set<number>()

  for (const mon of all_stored) {
    present.add(mon.dexNum)
  }

  return {
    national_unique_species: present.size,
    national_species_present: present,
  }
}

function is_requirement_met(snapshot: DexSnapshot, required_species: number[]): boolean {
  for (const id of required_species) {
    if (!snapshot.national_species_present.has(id)) return false
  }
  return true
}

export function evaluate_milestones(
  state: ProgressionState,
  snapshot: DexSnapshot,
  defs: MilestoneDefinition[],
): MilestoneDefinition[] {
  const newly_completed: MilestoneDefinition[] = []

  for (const m of defs) {
    if (state.completed_milestones[m.id]) continue

    if (m.kind === "national_living_dex") {
      if (is_requirement_met(snapshot, m.required_species)) newly_completed.push(m)
    }
  }

  return newly_completed
}

export function apply_newly_completed(
  state: ProgressionState,
  newly_completed: MilestoneDefinition[],
  reward_defs: Record<string, RewardDefinition>,
): { next_state: ProgressionState; newly_granted_rewards: RewardDefinition[] } {
  const next: ProgressionState = {
    ...state,
    completed_milestones: { ...state.completed_milestones },
    granted_rewards: { ...state.granted_rewards },
    reward_history: [...state.reward_history],
  }

  const newly_granted_rewards: RewardDefinition[] = []

  for (const m of newly_completed) {
    next.completed_milestones[m.id] = true

    const reward = reward_defs[m.reward_id]
    if (!reward) continue

    if (!next.granted_rewards[reward.id]) {
      next.granted_rewards[reward.id] = true
      next.reward_history.push({
        reward_id: reward.id,
        milestone_id: m.id,
        granted_at_iso: new Date().toISOString(),
      })
      newly_granted_rewards.push(reward)
    }
  }

  return { next_state: next, newly_granted_rewards }
}