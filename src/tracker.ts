import { getMonFileIdentifier, OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKMInterface } from './core/pkm/interfaces'
import { type Option } from './core/util/functional'

// export interface Tracked<Data, Identifier> {
//   readonly data: Data
//   readonly identifier: Identifier
// }

// export class MaybeTracked<Data, Identifier> implements HKT<Data, Identifier | undefined> {
//   private _identifier?: Identifier
//   private _data: Data

//   private constructor(data: Data, identifier?: Identifier) {
//     this._data = data
//     this._identifier = identifier
//   }

//   static tracked<Data, Identifier>(data: Data, identifier: Identifier) {
//     return new MaybeTracked(data, identifier)
//   }

//   static untracked<Data, Identifier>(data: Data) {
//     return new MaybeTracked<Data, Identifier>(data)
//   }

//   public get data() {
//     return this._data
//   }

//   public get identifier() {
//     return this._identifier
//   }

//   isTracked(): this is Tracked<Data, Identifier> {
//     return this._identifier !== undefined
//   }

//   get _URI() {
//     return this._data
//   }

//   set _URI(value: Data) {
//     this._URI = value
//   }

//   get _A() {
//     return this._identifier
//   }

//   set _A(value: Identifier | undefined) {
//     this._identifier = value
//   }
// }

type Tracked<Data, Identifier> = { _tag: 'Tracked'; data: Data; identifier: Identifier }

type Untracked<Data> = { _tag: 'Untracked'; data: Data }

export type MaybeTracked<Data, Identifier> = Tracked<Data, Identifier> | Untracked<Data>

export const URI = 'MaybeTracked'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    readonly MaybeTracked: MaybeTracked<A, E>
  }
}

const tracked = <A, E>(data: A, id: E): MaybeTracked<A, E> => ({
  _tag: 'Tracked',
  data,
  identifier: id,
})

const untracked = <A, E>(data: A): MaybeTracked<A, E> => ({
  _tag: 'Untracked',
  data,
})

export function isTracked<A, E>(maybe: MaybeTracked<A, E>) {
  return maybe._tag === 'Tracked'
}

export interface Tracker<Tracked, Identifier, ToTracked = Tracked> {
  load(identifier: Identifier): Option<Tracked>
  generateIdentifier(toTracked: ToTracked): Option<Identifier>
  wrapWithIdentifier<T extends ToTracked>(data: T): MaybeTracked<T, Identifier>
}

export class OhpkmTracker implements Tracker<OHPKM, OhpkmIdentifier, PKMInterface> {
  private _trackedMons: Map<OhpkmIdentifier, OHPKM>

  constructor() {
    this._trackedMons = new Map()
  }

  load(identifier: string): Option<OHPKM> {
    return this._trackedMons.get(identifier)
  }

  generateIdentifier(toTracked: PKMInterface): Option<OhpkmIdentifier> {
    return getMonFileIdentifier(toTracked)
  }

  wrapWithIdentifier<P extends PKMInterface>(data: P): MaybeTracked<P, string> {
    const identifier = this.generateIdentifier(data)
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
