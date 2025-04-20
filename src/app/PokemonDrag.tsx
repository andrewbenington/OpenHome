import {
  Active,
  DataRef,
  DndContextProps,
  DragCancelEvent,
  DragDropProvider,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  Over,
} from '@dnd-kit/react'
import { MonLocation, MonWithLocation } from '../state/openSaves'

export type PokemonDragOver = Omit<Over, 'data'> & { data: DataRef<MonLocation> }
export type PokemonDragActive = Omit<Active, 'data'> & { data: DataRef<MonWithLocation> }

type WithPokemonData<T extends { active: Active; over: Over | null }> = Omit<
  T,
  'active' | 'over'
> & {
  active: PokemonDragActive
  over: PokemonDragOver | null
}

export type PokemonDragStartEvent = Omit<DragStartEvent, 'active'> & { active: PokemonDragActive }
export type PokemonDragContextProps = Omit<
  DndContextProps,
  'onDragStart' | 'onDragMove' | 'onDragOver' | 'onDragEnd' | 'onDragCancel'
> & {
  onDragStart?(event: PokemonDragStartEvent): void
  onDragMove?(event: WithPokemonData<DragMoveEvent>): void
  onDragOver?(event: WithPokemonData<DragOverEvent>): void
  onDragEnd?(event: WithPokemonData<DragEndEvent>): void
  onDragCancel?(event: WithPokemonData<DragCancelEvent>): void
}

export type PokemonDragContextType = React.NamedExoticComponent<PokemonDragContextProps>

export const PokemonDragContext =
  DragDropProvider as React.NamedExoticComponent<PokemonDragContextProps>
