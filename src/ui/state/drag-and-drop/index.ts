import { UniqueIdentifier } from '@dnd-kit/core'
import { Item } from '@pkm-rs/pkg'
import { createContext, Dispatch, SetStateAction } from 'react'
import { MonLocation, MonWithLocation } from '../saves'

export type DragMonState = {
  payload?: DragPayload
  mode: DragMode
  onEnterListeners: ListenerMap
  onExitListeners: ListenerMap
  overId: UniqueIdentifier | null
  multiSelectEnabled: boolean
  selectedLocations: MonLocation[]
}

export function emptyDragState(): DragMonState {
  return {
    mode: 'mon',
    onEnterListeners: new Map(),
    onExitListeners: new Map(),
    overId: null,
    multiSelectEnabled: false,
    selectedLocations: [],
  }
}

export const DragMonContext = createContext<[DragMonState, Dispatch<SetStateAction<DragMonState>>]>(
  [emptyDragState(), () => null]
)

export type DragPayload =
  | { kind: 'mon'; monData: MonWithLocation }
  | { kind: 'item'; item: Item }
  | { kind: 'multi-mon'; monData: MonWithLocation[] }

export type DragMode = 'mon' | 'item'

type ListenerMap = Map<UniqueIdentifier, Listener>
export type Listener = () => void

export function locationKey(location: MonLocation): string {
  if (location.isHome) {
    return `home:${location.bank}:${location.box}:${location.boxSlot}`
  }

  return `save:${location.saveIdentifier}:${location.box}:${location.boxSlot}`
}
