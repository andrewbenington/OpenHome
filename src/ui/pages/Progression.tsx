import React, { useContext, useEffect, useMemo, useRef, useState } from "react"

import type BackendInterface from "@openhome-ui/backend/backendInterface"
import { BackendContext } from "@openhome-ui/backend/backendContext"
import { OHPKM } from "@openhome-core/pkm/OHPKM"
import { R } from "@openhome-core/util/functional"
import { useOhpkmStore } from "@openhome-ui/state/ohpkm/useOhpkmStore"
import { useSaves } from "@openhome-ui/state/saves/useSaves"

import { milestones, rewards } from "../progression/milestones"
import { apply_newly_completed, compute_dex_snapshot, evaluate_milestones, update_types_ever_deposited } from "../progression/progressionService"
import { load_progression_state, write_progression_state } from "../progression/progressionStore"
import { REGION_DEX_DATA, getRegionalDexCount } from "../progression/dexTracker"
import type { MilestoneDefinition, ProgressionState, RewardDefinition } from "../progression/types"

async function create_reward_ohpkm_from_template(
  backend: BackendInterface,
  reward_id: string,
): Promise<OHPKM> {
  const res = await backend.getRewardTemplateBytes(reward_id)

  if (R.isErr(res)) {
    const details = typeof res.err === "string" ? res.err : JSON.stringify(res.err, null, 2)
    throw new Error("Failed to load reward template bytes: " + details)
  }

  const raw = res.value as any

  const bytes =
    raw instanceof Uint8Array
      ? raw
      : Array.isArray(raw)
        ? new Uint8Array(raw)
        : raw && raw.data && Array.isArray(raw.data)
          ? new Uint8Array(raw.data)
          : null

  if (!bytes) {
    console.error("template bytes not in expected format", raw)
    throw new Error("Failed to load reward template bytes")
  }

  const openhomeIdRes = await (backend as any).computeOpenhomeIdFromBytes(bytes)
  if (R.isErr(openhomeIdRes)) throw new Error("Failed to compute canonical openhome id")
  const openhomeId = openhomeIdRes.value

  const rewardMon = OHPKM.fromBytes(bytes.buffer as ArrayBuffer)
  ;(rewardMon as any).fileIdentifier = openhomeId

  return rewardMon
}

function homeHasIdentifier(homeData: any, needle: string): boolean {
  try {
    for (const b of homeData.banks ?? []) {
      const simple = b.toSimple ? b.toSimple() : b
      const boxes = simple.boxes ?? simple.Boxes ?? []
      for (const box of boxes) {
        const slots = box.slots ?? box.Slots ?? []
        for (const slot of slots) {
          if (slot === needle) return true
        }
      }
    }
  } catch {}
  return false
}

export default function Progression() {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()
  const backend = useContext(BackendContext)

  const allStored = useMemo(() => {
    const stored = ohpkmStore.getAllStored() as OHPKM[]
    console.log('Loaded stored Pokemon:', stored.length)
    return stored
  }, [ohpkmStore])
  const snapshot = useMemo(() => {
    const snap = compute_dex_snapshot(allStored)
    console.log('Computed snapshot:', snap)
    return snap
  }, [allStored])

  const [state, setState] = useState<ProgressionState | null>(null)
  const [lastGrants, setLastGrants] = useState<RewardDefinition[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string>("national_dex")
  const [collectingMilestoneIds, setCollectingMilestoneIds] = useState<Record<string, true>>({})

  const grantedThisSessionRef = useRef<Set<string>>(new Set())
  const isEvaluatingRef = useRef(false)

  // Group milestones by kind
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, MilestoneDefinition[]> = {}
    for (const m of milestones) {
      if (!groups[m.kind]) groups[m.kind] = []
      groups[m.kind].push(m)
    }
    return groups
  }, [])

  // Milestone categories for tabs
  const categories = [
    { id: "national_dex", title: "National Dex", subtitle: "Progress toward National Dex completion" },
    { id: "regional_dex", title: "Regional Dex", subtitle: "Complete region-specific pokedexes" },
    { id: "type_count", title: "Type Mastery", subtitle: "Collect Pokémon by type" },
    { id: "shiny_hunt", title: "Shiny Collection", subtitle: "Build your shiny collection" },
  ]

  useEffect(() => {
    let alive = true
    load_progression_state(backend)
      .then((s) => {
        if (!alive) return
        setState(s)
      })
      .catch((e) => {
        if (!alive) return
        setError(String(e))
      })
    return () => {
      alive = false
    }
  }, [backend])

  /**
   * Keep types_ever_deposited in sync with current vault.
   * This ensures the historical record captures all types that have been in the vault,
   * even types that were later withdrawn.
   */
  useEffect(() => {
    if (!state) return

    const { types_ever_deposited: updated_types } = update_types_ever_deposited(state, snapshot)

    // Only update state if types actually changed
    if (JSON.stringify(updated_types) !== JSON.stringify(state.types_ever_deposited)) {
      setState((prev) => {
        if (!prev) return prev
        return { ...prev, types_ever_deposited: updated_types }
      })
    }
  }, [snapshot, state])

  async function deposit_reward_with_template(rewardMon: OHPKM): Promise<void> {
    // Double-check one more time right before placement
    const needle = rewardMon.fileIdentifier
    if (homeHasIdentifier(saves.homeData, needle)) {
      console.log("Skipping duplicate reward already in Home (final check)", needle)
      return
    }

    if (!rewardMon.bytes || !(rewardMon.bytes instanceof Uint8Array)) {
      throw new Error("Reward mon bytes are invalid")
    }

    const addRes = await backend.addToOhpkmStore({ [rewardMon.fileIdentifier]: rewardMon })
    if (R.isErr(addRes)) throw new Error("Failed to add reward to store")

    let placedOk = false

    for (let boxIndex = 0; boxIndex < 30; boxIndex++) {
      const dest = saves.homeData.firstEmptyBoxSlotCurrentBank(boxIndex)
      if (!dest) continue

      const requestedDest = dest as any

      // Use only ONE placement method to avoid duplicates
      if (saves.homeData.setAtLocation) {
        saves.homeData.setAtLocation(requestedDest, rewardMon.fileIdentifier)
        placedOk = true
      } else {
        // Fallback to importMonsToLocation only if setAtLocation doesn't exist
        saves.importMonsToLocation([rewardMon], requestedDest)
        placedOk = true
      }

      if (placedOk) break
    }

    if (!placedOk) throw new Error("No empty Home slot found in current bank")

    const banksPayload = {
      banks: saves.homeData.banks.map((b: any) => b.toSimple()),
      current_bank: saves.homeData.currentBankIndex,
    }

    const writeRes = await backend.writeHomeBanks(banksPayload as any)
    if (R.isErr(writeRes)) throw new Error("Failed to persist Home bank changes")
  }

  function getMilestoneUiState(m: MilestoneDefinition): "pending" | "ready" | "granted" {
    if (!state || !snapshot) return "pending"
    
    // For progressive milestones, check if all levels have been completed
    if (m.kind === "type_count_progressive" && m.levels) {
      const currentLevel = state.progressive_milestone_levels?.[m.id] ?? 0
      // If we've completed all levels, show granted
      if (currentLevel >= m.levels.length) return "granted"
      // Otherwise evaluate if the next level is ready
      const newlyCompleted = evaluate_milestones(state, snapshot, [m])
      return newlyCompleted.length > 0 ? "ready" : "pending"
    }
    
    if (state.granted_rewards?.[m.reward_id]) return "granted"
    if (state.completed_milestones?.[m.id]) return "ready"
    const newlyCompleted = evaluate_milestones(state, snapshot, [m])
    return newlyCompleted.length > 0 ? "ready" : "pending"
  }

  async function collectMilestone(milestone: MilestoneDefinition): Promise<void> {
    if (!state) return
    if (isEvaluatingRef.current) return
    if (state.granted_rewards?.[milestone.reward_id]) return

    const uiState = getMilestoneUiState(milestone)
    if (uiState !== "ready") return

    setCollectingMilestoneIds((prev) => ({ ...prev, [milestone.id]: true }))
    isEvaluatingRef.current = true

    try {
      const milestonesToApply = state.completed_milestones?.[milestone.id]
        ? [milestone]
        : evaluate_milestones(state, snapshot, [milestone])

      const { next_state, newly_granted_rewards } = apply_newly_completed(state, milestonesToApply, rewards, snapshot)

      if (newly_granted_rewards.length === 0) {
        setLastGrants([])
        return
      }

      const uniqueRewards = Array.from(new Map(newly_granted_rewards.map((r) => [r.id, r])).values())

      const toGrant = uniqueRewards.filter((r) => {
        if (state.granted_rewards?.[r.id]) return false
        if (grantedThisSessionRef.current.has(r.id)) return false
        return true
      })

      const toGrantWithTemplates: Array<{ reward: RewardDefinition; template: OHPKM }> = []
      for (const r of toGrant) {
        const template = await create_reward_ohpkm_from_template(backend, r.id)
        const alreadyInHome = homeHasIdentifier(saves.homeData, template.fileIdentifier)

        if (alreadyInHome) {
          next_state.granted_rewards[r.id] = true
          grantedThisSessionRef.current.add(r.id)
        } else {
          toGrantWithTemplates.push({ reward: r, template })
        }
      }

      for (const { reward } of toGrantWithTemplates) {
        grantedThisSessionRef.current.add(reward.id)
        next_state.granted_rewards[reward.id] = true
      }

      for (const { reward, template } of toGrantWithTemplates) {
        await deposit_reward_with_template(template)
        console.log("Reward granted", reward.id)
      }

      await write_progression_state(backend, next_state)

      setState(next_state)
      setLastGrants(newly_granted_rewards)
    } catch (e) {
      setError(String(e))
    } finally {
      isEvaluatingRef.current = false
      setCollectingMilestoneIds((prev) => {
        const next = { ...prev }
        delete next[milestone.id]
        return next
      })
    }
  }

  if (!state) return <div style={{ padding: 24 }}>Loading progression</div>

  const nationalDexMilestones = groupedMilestones["national_dex_threshold"] ?? []
  const regionalMilestones = groupedMilestones["regional_dex_100"] ?? []
  const typeMasteryMilestones = [
    ...(groupedMilestones["type_count"] ?? []),
    ...(groupedMilestones["type_count_progressive"] ?? []),
  ]
  const shinyCollectionMilestones = groupedMilestones["shiny_count"] ?? []

  return (
    <div style={{ padding: 24, height: "100vh", overflowY: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Progression</h1>
      </div>

      {error ? <div style={{ marginTop: 12, color: "#ef4444" }}>Error: {error}</div> : null}

      {/* Summary Stats */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af" }}>National Unique Species</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f9fafb", marginTop: 4 }}>
            {snapshot.national_unique_species}
          </div>
        </div>
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Shiny Pokémon</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fbbf24", marginTop: 4 }}>
            {snapshot.shiny_count ?? 0}
          </div>
        </div>
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Milestones Completed</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f9fafb", marginTop: 4 }}>
            {Object.keys(state.completed_milestones).length}
          </div>
        </div>
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Rewards Granted</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f9fafb", marginTop: 4 }}>
            {Object.keys(state.granted_rewards).length}
          </div>
        </div>
      </div>

      {/* Milestone Tracks */}
      <div
        style={{
          marginTop: 20,
          border: "1px solid #1f2937",
          borderRadius: 10,
          background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
          padding: 12,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#f9fafb" }}>Milestone Tracks</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
          Complete challenges to unlock exclusive event Pokémon rewards
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 12,
          }}
        >
          {categories.map((category) => {
            const isActive = activeCategoryId === category.id
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                style={{
                  border: isActive ? "1px solid #3b82f6" : "1px solid #374151",
                  background: isActive ? "#1e3a8a" : "#111827",
                  color: "#e5e7eb",
                  borderRadius: 999,
                  padding: "6px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                }}
              >
                {category.title}
              </button>
            )
          })}
        </div>

        {/* National Dex Category */}
        {activeCategoryId === "national_dex" && (
          <div
            style={{
              border: "1px solid #374151",
              borderRadius: 8,
              background: "#111827",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ fontWeight: 700, color: "#f9fafb" }}>National Dex Completion</div>
              <div style={{ fontSize: 12, marginTop: 2, color: "#9ca3af" }}>
                Progress toward full National Dex ownership (1025 species)
              </div>
            </div>

            <div style={{ padding: 10, maxHeight: 320, overflowY: "auto" }}>
              {nationalDexMilestones.map((m) => {
                const uiState = getMilestoneUiState(m)
                const granted = uiState === "granted"
                const ready = uiState === "ready"
                const isCollecting = Boolean(collectingMilestoneIds[m.id])
                const current = snapshot.national_unique_species
                const target = m.national_threshold ?? 0
                const progress = Math.min(100, Math.round((current / target) * 100))

                return (
                  <div
                    key={m.id}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "#f9fafb", fontWeight: 600 }}>{m.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12 }}>
                          {current} / {target} ({progress}%)
                        </div>
                      </div>
                      <button
                        onClick={() => void collectMilestone(m)}
                        disabled={uiState !== "ready" || isCollecting}
                        style={{
                          border:
                            granted
                              ? "1px solid #14532d"
                              : ready
                                ? "1px solid #22c55e"
                                : "1px solid #374151",
                          background: granted ? "#14532d" : ready ? "#0f5c2e" : "#374151",
                          color: "#e5e7eb",
                          borderRadius: 999,
                          fontSize: 11,
                          padding: "6px 10px",
                          cursor: ready && !isCollecting ? "pointer" : "default",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {granted ? "✓ Collected" : isCollecting ? "..." : ready ? "Collect" : "Locked"}
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        background: "#0f172a",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          background: ready ? "#22c55e" : "#3b82f6",
                          height: "100%",
                          width: `${progress}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      Reward: {rewards[m.reward_id]?.name ?? "Unknown"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Regional Dex Category - Note for future move to Pokedex page */}
        {activeCategoryId === "regional_dex" && (
          <div
            style={{
              border: "1px solid #374151",
              borderRadius: 8,
              background: "#111827",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ fontWeight: 700, color: "#f9fafb" }}>Regional Dex Completion</div>
              <div style={{ fontSize: 12, marginTop: 2, color: "#9ca3af" }}>
                Complete region-specific pokedexes for mythical rewards
              </div>
            </div>

            <div style={{ padding: 10, maxHeight: 320, overflowY: "auto" }}>
              {regionalMilestones.map((m) => {
                const uiState = getMilestoneUiState(m)
                const granted = uiState === "granted"
                const ready = uiState === "ready"
                const isCollecting = Boolean(collectingMilestoneIds[m.id])
                const regionId = m.region_id!
                const current = getRegionalDexCount(snapshot.national_species_present, regionId as any)
                const target = REGION_DEX_DATA.find((r) => r.id === regionId)?.totalSpecies ?? 0
                const progress = Math.min(100, Math.round((current / target) * 100))

                return (
                  <div
                    key={m.id}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "#f9fafb", fontWeight: 600 }}>{m.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12 }}>
                          {current} / {target} ({progress}%)
                        </div>
                      </div>
                      <button
                        onClick={() => void collectMilestone(m)}
                        disabled={uiState !== "ready" || isCollecting}
                        style={{
                          border:
                            granted
                              ? "1px solid #14532d"
                              : ready
                                ? "1px solid #22c55e"
                                : "1px solid #374151",
                          background: granted ? "#14532d" : ready ? "#0f5c2e" : "#374151",
                          color: "#e5e7eb",
                          borderRadius: 999,
                          fontSize: 11,
                          padding: "6px 10px",
                          cursor: ready && !isCollecting ? "pointer" : "default",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {granted ? "✓ Collected" : isCollecting ? "..." : ready ? "Collect" : "Locked"}
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        background: "#0f172a",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          background: ready ? "#22c55e" : "#3b82f6",
                          height: "100%",
                          width: `${progress}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      Reward: {rewards[m.reward_id]?.name ?? "Unknown"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Type Count Category - Placeholder */}
        {activeCategoryId === "type_count" && (
          <div
            style={{
              border: "1px solid #374151",
              borderRadius: 8,
              background: "#111827",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ fontWeight: 700, color: "#f9fafb" }}>Type Mastery Challenges</div>
              <div style={{ fontSize: 12, marginTop: 2, color: "#9ca3af" }}>
                Collect specific numbers of Pokémon by type
              </div>
            </div>

            <div style={{ padding: 10, maxHeight: 320, overflowY: "auto" }}>
              {!snapshot || !snapshot.type_counts ? (
                <div style={{ color: "#ef4444", fontSize: 12, padding: "20px", textAlign: "center" }}>
                  Error: Unable to load type data
                </div>
              ) : typeMasteryMilestones.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 12, padding: "20px", textAlign: "center" }}>
                  No type mastery milestones available
                </div>
              ) : (
                typeMasteryMilestones.map((m) => {
                  try {
                    // Validate inputs
                    if (!m || !m.id) {
                      throw new Error("Invalid milestone data structure")
                    }
                    if (!rewards || typeof rewards !== 'object') {
                      throw new Error("Rewards data not loaded")
                    }
                    
                    // Step 1: Get UI state
                    let uiState: "pending" | "ready" | "granted" = "pending"
                    try {
                      uiState = getMilestoneUiState(m)
                    } catch(e) {
                      throw new Error(`Failed to get UI state: ${String(e)}`)
                    }

                    const granted = uiState === "granted"
                    const ready = uiState === "ready"
                    const isCollecting = Boolean(collectingMilestoneIds[m.id])
                    
                    // Step 2: Get current count with safe access
                    let current = 0
                    try {
                      if (snapshot && snapshot.type_counts && m.target_type) {
                        current = snapshot.type_counts[m.target_type] ?? 0
                      }
                    } catch(e) {
                      console.warn(`Failed to get current count for ${m.target_type}:`, e)
                      current = 0
                    }
                    
                    // Step 3: Determine target and reward
                    let target = 1 // Default to 1 to avoid division by zero
                    let rewardId = m.reward_id
                    let rewardName = "Unknown"
                    
                    try {
                      rewardName = rewards[rewardId]?.name ?? "Unknown"
                    } catch(e) {
                      console.warn(`Failed to get reward name for ${rewardId}:`, e)
                    }
                    
                    // Step 4: Handle progressive vs regular milestones
                    try {
                      if (m.kind === "type_count_progressive") {
                        if (!Array.isArray(m.levels) || m.levels.length === 0) {
                          throw new Error("Progressive milestone missing or invalid levels data")
                        }
                        const currentLevel = (state && state.progressive_milestone_levels) ? (state.progressive_milestone_levels[m.id] ?? 0) : 0
                        if (currentLevel < m.levels.length) {
                          const levelDef = m.levels[currentLevel]
                          if (!levelDef || typeof levelDef !== 'object') {
                            throw new Error(`Level ${currentLevel} invalid: ${String(levelDef)}`)
                          }
                          if (!('target_count' in levelDef) || !('reward_id' in levelDef)) {
                            throw new Error(`Level ${currentLevel} missing required properties`)
                          }
                          target = (levelDef as any).target_count ?? 1
                          rewardId = (levelDef as any).reward_id
                          rewardName = rewards[rewardId]?.name ?? "Unknown"
                        } else {
                          // All levels completed, show last level's info
                          const lastLevel = m.levels[m.levels.length - 1]
                          if (lastLevel && typeof lastLevel === 'object' && 'target_count' in lastLevel) {
                            target = (lastLevel as any).target_count ?? 1
                            rewardName = "All Levels Complete!"
                          }
                        }
                      } else if (m.kind === "type_count" && m.target_count) {
                        target = m.target_count
                      }
                    } catch(e) {
                      throw new Error(`Failed to handle progressive milestone: ${String(e)}`)
                    }
                    
                    const progress = Math.min(100, Math.round((current / target) * 100))

                    console.log(`Rendering milestone ${m.id}:`, { 
                      name: m.name, 
                      kind: m.kind, 
                      current, 
                      target, 
                      progress,
                      rewardId,
                      rewardName 
                    })

                    return (
                      <div
                        key={m.id}
                        style={{
                          background: "#0b1220",
                          border: "1px solid #1f2937",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <div style={{ color: "#f9fafb", fontWeight: 600 }}>{m.name}</div>
                            <div style={{ color: "#9ca3af", fontSize: 12 }}>
                              {current} / {target} ({progress}%)
                            </div>
                          </div>
                          <button
                            onClick={() => void collectMilestone(m)}
                            disabled={uiState !== "ready" || isCollecting}
                            style={{
                              border:
                                granted
                                  ? "1px solid #14532d"
                                  : ready
                                    ? "1px solid #22c55e"
                                    : "1px solid #374151",
                              background: granted ? "#14532d" : ready ? "#0f5c2e" : "#374151",
                              color: "#e5e7eb",
                              borderRadius: 999,
                              fontSize: 11,
                              padding: "6px 10px",
                              cursor: ready && !isCollecting ? "pointer" : "default",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {granted ? "✓ Completed" : isCollecting ? "..." : ready ? "Collect" : "Locked"}
                          </button>
                        </div>

                        {/* Progress bar */}
                        <div
                          style={{
                            background: "#0f172a",
                            borderRadius: 4,
                            height: 6,
                            overflow: "hidden",
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              background: ready ? "#22c55e" : "#3b82f6",
                              height: "100%",
                              width: `${progress}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          Reward: {rewardName}
                        </div>
                      </div>
                    )
                  } catch (e) {
                    const errorMsg = e instanceof Error ? e.message : String(e)
                    console.error('Error rendering type mastery milestone:', {
                      milestoneId: m?.id,
                      milestoneName: m?.name,
                      kind: m?.kind,
                      error: errorMsg,
                      fullError: e,
                    })
                    return (
                      <div key={m?.id ?? 'unknown'} style={{ color: '#ef4444', padding: '10px', fontSize: '12px', border: '1px solid #ef4444', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 600 }}>Error: {m?.name ?? 'Unknown Milestone'}</div>
                        <div style={{ fontSize: '11px', marginTop: '4px' }}>{errorMsg}</div>
                      </div>
                    )
                  }
                })
              )}

            </div>
          </div>
        )}

        {activeCategoryId === "shiny_hunt" && (
          <div
            style={{
              border: "1px solid #374151",
              borderRadius: 8,
              background: "#111827",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ fontWeight: 700, color: "#f9fafb" }}>Shiny Collection Milestones</div>
              <div style={{ fontSize: 12, marginTop: 2, color: "#9ca3af" }}>
                Build your shiny collection and earn exclusive event Pokémon
              </div>
            </div>

            <div style={{ padding: 10, maxHeight: 320, overflowY: "auto" }}>
              {shinyCollectionMilestones.map((m) => {
                const uiState = getMilestoneUiState(m)
                const granted = uiState === "granted"
                const ready = uiState === "ready"
                const isCollecting = Boolean(collectingMilestoneIds[m.id])
                const current = snapshot.shiny_count ?? 0
                const target = m.target_count ?? 0
                const progress = Math.min(100, Math.round((current / target) * 100))

                return (
                  <div
                    key={m.id}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ color: "#f9fafb", fontWeight: 600 }}>{m.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12 }}>
                          {current} / {target} ({progress}%)
                        </div>
                      </div>
                      <button
                        onClick={() => void collectMilestone(m)}
                        disabled={uiState !== "ready" || isCollecting}
                        style={{
                          border:
                            granted
                              ? "1px solid #14532d"
                              : ready
                                ? "1px solid #22c55e"
                                : "1px solid #374151",
                          background: granted ? "#14532d" : ready ? "#0f5c2e" : "#374151",
                          color: "#e5e7eb",
                          borderRadius: 999,
                          fontSize: 11,
                          padding: "6px 10px",
                          cursor: ready && !isCollecting ? "pointer" : "default",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {granted ? "✓ Collected" : isCollecting ? "..." : ready ? "Collect" : "Locked"}
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        background: "#0f172a",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          background: ready ? "#22c55e" : "#fbbf24",
                          height: "100%",
                          width: `${progress}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      Reward: {rewards[m.reward_id]?.name ?? "Unknown"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Grants */}
      {lastGrants.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb", marginBottom: 8 }}>Recently Granted</div>
          {lastGrants.map((r) => (
            <div
              key={r.id}
              style={{
                color: "#9ca3af",
                fontSize: 12,
                padding: "4px 0",
              }}
            >
              • {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
