import type { ProgressionState } from './types'
import type BackendInterface from '@openhome-ui/backend/backendInterface'
import { R } from '@openhome-core/util/functional'

const DEFAULT_PROFILE_ID = 'default'

const DEFAULT_STATE: ProgressionState = {
  version: 1,
  completed_milestones: {},
  granted_rewards: {},
  reward_history: [],
  types_ever_deposited: {},
  progressive_milestone_levels: {},
}

export async function load_progression_state(
  backend: BackendInterface,
  profile_id: string = DEFAULT_PROFILE_ID
): Promise<ProgressionState> {
  const res = await backend.loadProgression(profile_id)
  if (R.isErr(res) || !res.value) return DEFAULT_STATE

  try {
    const state = JSON.parse(res.value) as ProgressionState
    if (!state || state.version !== 1) return DEFAULT_STATE

    // Ensure all required fields are initialized
    return {
      version: state.version ?? 1,
      completed_milestones: state.completed_milestones ?? {},
      granted_rewards: state.granted_rewards ?? {},
      reward_history: state.reward_history ?? [],
      types_ever_deposited: state.types_ever_deposited ?? {},
      progressive_milestone_levels: state.progressive_milestone_levels ?? {},
    }
  } catch {
    return DEFAULT_STATE
  }
}

export async function write_progression_state(
  backend: BackendInterface,
  state: ProgressionState,
  profile_id: string = DEFAULT_PROFILE_ID
): Promise<void> {
  await backend.writeProgression(profile_id, JSON.stringify(state))
}
