import { OHPKM } from "@openhome-core/pkm/OHPKM"
import { MetadataLookup } from "@pkm-rs/pkg"
import type { DexSnapshot, MilestoneDefinition, ProgressionState, RewardDefinition } from "./types"
import { REGION_DEX_DATA, calculateRegionalDexCompletion, isRegionalDexComplete, isNationalDexThresholdMet } from "./dexTracker"

export function compute_dex_snapshot(all_stored: OHPKM[]): DexSnapshot {
  const present = new Set<number>()
  const type_counts: Record<string, number> = {}
  let shiny_count = 0

  try {
    for (const mon of all_stored) {
      try {
        if (!mon || isNaN(mon.dexNum) || isNaN(mon.formeNum)) {
          console.warn('Skipping invalid mon:', mon)
          continue
        }

        present.add(mon.dexNum)

        // Count shinies
        if (mon.isShiny()) {
          shiny_count++
        }

        // Get type information from metadata
        const metadata = MetadataLookup(mon.dexNum, mon.formeNum)
        if (metadata) {
          // Count primary type
          if (metadata.type1) {
            type_counts[metadata.type1] = (type_counts[metadata.type1] ?? 0) + 1
          }
          // Count secondary type if different from primary
          if (metadata.type2 && metadata.type2 !== metadata.type1) {
            type_counts[metadata.type2] = (type_counts[metadata.type2] ?? 0) + 1
          }
        }
      } catch (e) {
        console.warn('Error processing individual mon:', e, mon)
      }
    }

    // Calculate regional completion percentages
    const regional_completion: Record<string, number> = {}
    for (const region of REGION_DEX_DATA) {
      regional_completion[region.id] = calculateRegionalDexCompletion(present, region.id)
    }

    return {
      national_unique_species: present.size,
      national_species_present: present,
      regional_completion,
      type_counts,
      shiny_count,
    }
  } catch (e) {
    console.error('Error computing dex snapshot:', e)
    // Return a safe default state on error
    return {
      national_unique_species: 0,
      national_species_present: new Set(),
      regional_completion: {},
      type_counts: {},
      shiny_count: 0,
    }
  }
}

function is_requirement_met(snapshot: DexSnapshot, required_species: number[]): boolean {
  for (const id of required_species) {
    if (!snapshot.national_species_present.has(id)) return false
  }
  return true
}

/**
 * Update the historical record of types ever deposited.
 * Compares current vault types against history and adds any new types.
 * This is bulletproof because:
 * - `types_ever_deposited` only grows, never shrinks (safe from withdrawals)
 * - Works with snapshot-based system (no need for transaction logs)
 * - Handles duplicates naturally (multiple Pokemon of same type)
 */
export function update_types_ever_deposited(
  state: ProgressionState,
  snapshot: DexSnapshot,
): Pick<ProgressionState, "types_ever_deposited"> {
  const updated = { ...state.types_ever_deposited }

  // Add any newly encountered types
  for (const type of Object.keys(snapshot.type_counts)) {
    if (!updated[type]) {
      updated[type] = true
    }
  }

  return { types_ever_deposited: updated }
}

export function evaluate_milestones(
  state: ProgressionState,
  snapshot: DexSnapshot,
  defs: MilestoneDefinition[],
): MilestoneDefinition[] {
  const newly_completed: MilestoneDefinition[] = []

  // Safety check for snapshot
  if (!snapshot || !snapshot.type_counts) {
    console.warn('evaluate_milestones called with invalid snapshot:', snapshot)
    return newly_completed
  }

  for (const m of defs) {
    // For non-progressive milestones, skip if already completed
    if (m.kind !== "type_count_progressive" && state.completed_milestones[m.id]) continue

    if (m.kind === "national_living_dex") {
      if (m.required_species && is_requirement_met(snapshot, m.required_species)) {
        newly_completed.push(m)
      }
    } else if (m.kind === "regional_dex_100") {
      if (m.region_id && isRegionalDexComplete(snapshot.national_species_present, m.region_id as any)) {
        newly_completed.push(m)
      }
    } else if (m.kind === "national_dex_threshold") {
      if (m.national_threshold && isNationalDexThresholdMet(snapshot.national_species_present, m.national_threshold)) {
        newly_completed.push(m)
      }
    } else if (m.kind === "type_count") {
      // Type mastery milestone: check if we've seen enough of a specific type
      if (m.target_type && m.target_count && snapshot.type_counts) {
        const currentCount = snapshot.type_counts[m.target_type] ?? 0
        if (currentCount >= m.target_count) {
          newly_completed.push(m)
        }
      }
    } else if (m.kind === "type_count_progressive") {
      // Progressive type mastery: each completion unlocks next level
      if (m.target_type && m.levels && Array.isArray(m.levels) && m.levels.length > 0 && snapshot.type_counts) {
        const currentLevel = (state.progressive_milestone_levels && state.progressive_milestone_levels[m.id]) ?? 0
        
        // Check if we've met the current level's target
        if (currentLevel < m.levels.length) {
          const levelDef = m.levels[currentLevel]
          if (levelDef && typeof levelDef === 'object' && 'target_count' in levelDef) {
            const currentCount = snapshot.type_counts[m.target_type] ?? 0
            
            if (currentCount >= levelDef.target_count) {
              newly_completed.push(m)
            }
          }
        }
      }
    } else if (m.kind === "shiny_count") {
      // Shiny collection milestone: check if we have enough shinies in the bank
      if (m.target_count && snapshot.shiny_count >= m.target_count) {
        newly_completed.push(m)
      }
    }
  }

  return newly_completed
}

export function apply_newly_completed(
  state: ProgressionState,
  newly_completed: MilestoneDefinition[],
  reward_defs: Record<string, RewardDefinition>,
  snapshot: DexSnapshot,
): { next_state: ProgressionState; newly_granted_rewards: RewardDefinition[] } {
  const next: ProgressionState = {
    ...state,
    completed_milestones: { ...state.completed_milestones },
    granted_rewards: { ...state.granted_rewards },
    reward_history: [...state.reward_history],
    types_ever_deposited: { ...state.types_ever_deposited },
    progressive_milestone_levels: { ...state.progressive_milestone_levels },
  }

  // Update the historical record of types encountered
  const { types_ever_deposited } = update_types_ever_deposited(next, snapshot)
  next.types_ever_deposited = types_ever_deposited

  const newly_granted_rewards: RewardDefinition[] = []

  for (const m of newly_completed) {
    // Handle progressive milestones differently
    if (m.kind === "type_count_progressive" && Array.isArray(m.levels) && m.levels.length > 0) {
      const currentLevel = (next.progressive_milestone_levels && next.progressive_milestone_levels[m.id]) ?? 0
      
      if (currentLevel < m.levels.length) {
        // Get the current level's reward
        const levelDef = m.levels[currentLevel]
        if (!levelDef || !('reward_id' in levelDef)) {
          console.warn(`Invalid level definition at index ${currentLevel} for milestone ${m.id}`)
          continue
        }
        const reward = reward_defs[levelDef.reward_id]
        
        if (reward && !next.granted_rewards[reward.id]) {
          next.granted_rewards[reward.id] = true
          next.reward_history.push({
            reward_id: reward.id,
            milestone_id: m.id,
            granted_at_iso: new Date().toISOString(),
          })
          newly_granted_rewards.push(reward)
        }
        
        // Increment to next level
        next.progressive_milestone_levels[m.id] = currentLevel + 1
      }
    } else {
      // Non-progressive milestones: mark as completed
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
  }

  return { next_state: next, newly_granted_rewards }
}