import { UniqueIdentifier } from '@dnd-kit/core'
import { Item } from '@pkm-rs/pkg'
import { createContext, Dispatch, SetStateAction } from 'react'
import { MonWithLocation } from '../saves'

export type DragMonState = {
  payload?: DragPayload
  mode: DragMode
  onEnterListeners: ListenerMap
  onExitListeners: ListenerMap
  overId: UniqueIdentifier | null
}

export function emptyDragState(): DragMonState {
  return {
    mode: 'mon',
    onEnterListeners: new Map(),
    onExitListeners: new Map(),
    overId: null,
  }
}

export const DragMonContext = createContext<[DragMonState, Dispatch<SetStateAction<DragMonState>>]>(
  [emptyDragState(), () => null]
)

export type DragPayload = { kind: 'mon'; monData: MonWithLocation } | { kind: 'item'; item: Item }
export type DragMode = 'mon' | 'item'

type ListenerMap = Map<UniqueIdentifier, Listener>
export type Listener = () => void
