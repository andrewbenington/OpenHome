import React, { useContext, useEffect, useMemo, useRef, useState } from "react"

import type BackendInterface from "@openhome-ui/backend/backendInterface"
import { BackendContext } from "@openhome-ui/backend/backendContext"
import { OHPKM } from "@openhome-core/pkm/OHPKM"
import { R } from "@openhome-core/util/functional"
import { useOhpkmStore } from "@openhome-ui/state/ohpkm/useOhpkmStore"
import { useSaves } from "@openhome-ui/state/saves/useSaves"

import { milestones, rewards } from "../progression/milestones"
import { apply_newly_completed, compute_dex_snapshot, evaluate_milestones } from "../progression/progressionService"
import { load_progression_state, write_progression_state } from "../progression/progressionStore"
import type { MilestoneDefinition, ProgressionState, RewardDefinition } from "../progression/types"

const DEFAULT_PROGRESSION_STATE: ProgressionState = {
  version: 1,
  completed_milestones: {},
  granted_rewards: {},
  reward_history: [],
}

type MilestoneTierPreview = {
  id: string
  label: string
  progressLabel: string
  status: "locked" | "in_progress" | "ready"
}

type MilestoneCategoryPreview = {
  id: string
  title: string
  subtitle: string
  tiers: MilestoneTierPreview[]
}

const milestoneCategoryPreviewData: MilestoneCategoryPreview[] = [
  {
    id: "regional_dex_100",
    title: "Regional Dex Completion 100%",
    subtitle: "Complete each region-specific dex to full completion",
    tiers: [
      { id: "kanto", label: "Kanto 100%", progressLabel: "0 / target", status: "in_progress" },
      { id: "johto", label: "Johto 100%", progressLabel: "0 / target", status: "locked" },
      { id: "hoenn", label: "Hoenn 100%", progressLabel: "0 / target", status: "locked" },
    ],
  },
  {
    id: "national_dex_100",
    title: "National Dex Completion 100%",
    subtitle: "Progress toward full National Dex ownership",
    tiers: [
      { id: "natdex_phase_1", label: "National 25%", progressLabel: "0 / target", status: "in_progress" },
      { id: "natdex_phase_2", label: "National 50%", progressLabel: "0 / target", status: "locked" },
      { id: "natdex_phase_3", label: "National 100%", progressLabel: "0 / target", status: "locked" },
    ],
  },
  {
    id: "type_caught_count",
    title: "Type Caught Count",
    subtitle: "Register catches by type (duplicates allowed)",
    tiers: [
      {
        id: "psychic_100",
        label: "Psychic: 100 Registered",
        progressLabel: "0 / 100",
        status: "in_progress",
      },
      { id: "dragon_100", label: "Dragon: 100 Registered", progressLabel: "0 / 100", status: "locked" },
      { id: "ghost_100", label: "Ghost: 100 Registered", progressLabel: "0 / 100", status: "locked" },
    ],
  },
  {
    id: "shiny_caught_registered",
    title: "Shiny Count Caught/Registered",
    subtitle: "Track total shiny entries across your bank",
    tiers: [
      { id: "shiny_25", label: "25 Shinies Registered", progressLabel: "0 / 25", status: "in_progress" },
      { id: "shiny_100", label: "100 Shinies Registered", progressLabel: "0 / 100", status: "locked" },
      { id: "shiny_250", label: "250 Shinies Registered", progressLabel: "0 / 250", status: "locked" },
    ],
  },
]

function tierStatusColor(status: MilestoneTierPreview["status"]): string {
  if (status === "ready") return "#14532d"
  if (status === "in_progress") return "#1e3a8a"
  return "#374151"
}

function tierStatusText(status: MilestoneTierPreview["status"]): string {
  if (status === "ready") return "Ready"
  if (status === "in_progress") return "In Progress"
  return "Locked"
}

async function create_reward_ohpkm_from_template(
  backend: BackendInterface,
  reward_id: string,
): Promise<OHPKM> {
  const res = await backend.getRewardTemplateBytes(reward_id)

  if (res.isErr) {
    const details =
      res && res.error
        ? typeof res.error === "string"
          ? res.error
          : JSON.stringify(res.error, null, 2)
        : "unknown backend error"
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

  const allStored = useMemo(() => ohpkmStore.getAllStored() as OHPKM[], [ohpkmStore])
  const snapshot = useMemo(() => compute_dex_snapshot(allStored), [allStored])

  const [state, setState] = useState<ProgressionState | null>(null)
  const [lastGrants, setLastGrants] = useState<RewardDefinition[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string>(milestoneCategoryPreviewData[0]?.id ?? "")
  const [collectingMilestoneIds, setCollectingMilestoneIds] = useState<Record<string, true>>({})

  const grantedThisSessionRef = useRef<Set<string>>(new Set())
  const isEvaluatingRef = useRef(false)

  const testMilestones = useMemo(
    () => milestones.filter((m) => m.id.includes("test") || m.id.includes("smoke") || m.name.toLowerCase().includes("test")),
    [],
  )

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
    if (!state) return "pending"
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

      const { next_state, newly_granted_rewards } = apply_newly_completed(state, milestonesToApply, rewards)

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

  async function resetProgression(): Promise<void> {
    try {
      await write_progression_state(backend, DEFAULT_PROGRESSION_STATE)
      setState(DEFAULT_PROGRESSION_STATE)
      setLastGrants([])
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }

  if (!state) return <div style={{ padding: 24 }}>Loading progression</div>

  return (
    <div style={{ padding: 24 }}>
      <h1>Progression</h1>

      {error ? <div style={{ marginTop: 12 }}>Error {error}</div> : null}

      <div style={{ marginTop: 12 }}>
        <div>National unique species in vault {snapshot.national_unique_species}</div>
        <div>Milestones completed {Object.keys(state.completed_milestones).length}</div>
        <div>Rewards granted {Object.keys(state.granted_rewards).length}</div>
      </div>

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
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
          Foundation layout for upcoming progression categories and tier rewards
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 8,
          }}
        >
          {milestoneCategoryPreviewData.map((category) => {
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
                  padding: "6px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {category.title}
              </button>
            )
          })}
        </div>

        {milestoneCategoryPreviewData
          .filter((category) => category.id === activeCategoryId)
          .map((category) => (
            <div
              key={category.id}
              style={{
                border: "1px solid #374151",
                borderRadius: 8,
                background: "#111827",
                marginBottom: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid #1f2937",
                  color: "#f3f4f6",
                }}
              >
                <div style={{ fontWeight: 700 }}>{category.title}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: "#9ca3af" }}>{category.subtitle}</div>
              </div>

              <div style={{ padding: 10, maxHeight: 220, overflowY: "auto" }}>
                {category.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      padding: "8px 10px",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ color: "#f9fafb", fontWeight: 600 }}>{tier.label}</div>
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>{tier.progressLabel}</div>
                    </div>
                    <div
                      style={{
                        background: tierStatusColor(tier.status),
                        color: "#e5e7eb",
                        borderRadius: 999,
                        fontSize: 11,
                        padding: "3px 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tierStatusText(tier.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        <div
          style={{
            marginTop: 10,
            borderTop: "1px solid #1f2937",
            paddingTop: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb", marginBottom: 6 }}>Test Milestones</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
            Temporary QA milestones for validating reward output without full progression grind
          </div>

          {testMilestones.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 12 }}>No test milestones configured</div>
          ) : (
            <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 2 }}>
              {testMilestones.map((m) => {
                const uiState = getMilestoneUiState(m)
                const granted = uiState === "granted"
                const ready = uiState === "ready"
                const isCollecting = Boolean(collectingMilestoneIds[m.id])

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      background: "#0b1220",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      padding: "8px 10px",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ color: "#f9fafb", fontWeight: 600 }}>{m.name}</div>
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>Reward: {rewards[m.reward_id]?.name ?? m.reward_id}</div>
                    </div>
                    <button
                      onClick={() => void collectMilestone(m)}
                      disabled={granted || !ready || isCollecting || isEvaluatingRef.current}
                      style={{
                        border: granted ? "1px solid #14532d" : ready ? "1px solid #3b82f6" : "1px solid #374151",
                        background: granted ? "#14532d" : ready ? "#1e3a8a" : "#374151",
                        color: "#e5e7eb",
                        borderRadius: 999,
                        fontSize: 11,
                        padding: "6px 10px",
                        cursor: granted || !ready || isCollecting ? "default" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {granted ? "Collected" : isCollecting ? "Collecting..." : ready ? "Collect" : "Pending"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={resetProgression}>Reset Progression</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <div>Most recent grants</div>
        {lastGrants.length === 0 ? <div>None</div> : lastGrants.map((r) => <div key={r.id}>{r.name}</div>)}
      </div>
    </div>
  )
}
