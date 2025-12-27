import { Item } from '@pkm-rs/pkg'
import { createContext } from 'react'
import { MonWithLocation } from '../saves'

const initialState: DragMonState = { mode: 'mon' }

export const DragMonContext = createContext<[DragMonState, (state: DragMonState) => void]>([
  initialState,
  () => null,
])

export type DragPayload = { kind: 'mon'; monData: MonWithLocation } | { kind: 'item'; item: Item }
export type DragMode = 'mon' | 'item'

export type DragMonState = { payload?: DragPayload; mode: DragMode }
