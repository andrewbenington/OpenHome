import { Item } from '@pkm-rs/pkg'
import { MonLocation, MonWithLocation } from '../saves'

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
