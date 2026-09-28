import { Item } from '@pkm-rs/pkg'
import { createContext, Dispatch, SetStateAction } from 'react'
import { MonLocation, MonWithLocation } from '../saves'

export type DragMonState = {
  multiSelectEnabled: boolean
  selectedLocations: MonLocation[]
}

export function emptyDragState(): DragMonState {
  return {
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

export function locationKey(location: MonLocation): string {
  if (location.isHome) {
    return `home:${location.bank}:${location.box}:${location.boxSlot}`
  }

  return `save:${location.saveIdentifier}:${location.box}:${location.boxSlot}`
}
