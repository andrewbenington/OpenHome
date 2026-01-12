import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  OhpkmIdentifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKMInterface } from './core/pkm/interfaces'
import { LookupType } from './core/save/util'
import { type Option } from './core/util/functional'
import { StoredLookups } from './ui/backend/backendInterface'

type Tracked<P extends PKMInterface> = { _tag: 'Tracked'; data: P; identifier: OhpkmIdentifier }

type Untracked<P> = { _tag: 'Untracked'; data: P }

export type MaybeTracked<P extends PKMInterface = PKMInterface> = Tracked<P> | Untracked<P>

export const tracked = <P extends PKMInterface>(data: P, id: OhpkmIdentifier): MaybeTracked<P> => ({
  _tag: 'Tracked',
  data,
  identifier: id,
})

export const untracked = <P extends PKMInterface>(data: P): MaybeTracked<P> => ({
  _tag: 'Untracked',
  data,
})

export function isTracked<P extends PKMInterface>(maybe: MaybeTracked<P>) {
  return maybe._tag === 'Tracked'
}

export class OhpkmTracker {
  private _trackedMons: Map<OhpkmIdentifier, OHPKM>
  private _gen12Lookup: Map<string, string>
  private _gen345Lookup: Map<string, string>

  constructor(mons?: Record<string, OHPKM>, lookups?: StoredLookups) {
    this._trackedMons = new Map(Object.entries(mons ?? {}))
    this._gen12Lookup = new Map(Object.entries(lookups?.gen12 ?? {}))
    this._gen345Lookup = new Map(Object.entries(lookups?.gen345 ?? {}))
  }

  load(identifier: string): Option<OHPKM> {
    return this._trackedMons.get(identifier)
  }

  ohpkmIfTracked<P extends PKMInterface>(maybeTracked: MaybeTracked<P>): OHPKM | P {
    if (isTracked(maybeTracked)) {
      return this.load(maybeTracked.identifier) ?? maybeTracked.data
    } else {
      return maybeTracked.data
    }
  }

  generateIdentifier(toTracked: PKMInterface): Option<OhpkmIdentifier> {
    return getMonFileIdentifier(toTracked)
  }

  getOhpkmIdentifierIfTrackedGen12(mon: PKMInterface): Option<OhpkmIdentifier> {
    const g12Identifier = getMonGen12Identifier(mon)
    if (!g12Identifier) return undefined
    return this._gen12Lookup.get(g12Identifier)
  }

  getOhpkmIdentifierIfTrackedGen345(mon: PKMInterface): Option<OhpkmIdentifier> {
    const g345Identifier = getMonGen12Identifier(mon)
    if (!g345Identifier) return undefined
    return this._gen345Lookup.get(g345Identifier)
  }

  wrapWithIdentifier<P extends PKMInterface>(data: P, lookupType?: LookupType): MaybeTracked<P> {
    const identifier =
      lookupType === 'gen12'
        ? this.getOhpkmIdentifierIfTrackedGen12(data)
        : lookupType === 'gen345'
          ? this.getOhpkmIdentifierIfTrackedGen345(data)
          : this.generateIdentifier(data)
    if (identifier && this._trackedMons.has(identifier)) {
      return tracked(data, identifier)
    } else {
      return untracked(data)
    }
  }
}

export function EmptyTracker() {
  return new OhpkmTracker()
}
