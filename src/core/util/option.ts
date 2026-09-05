import { Mapper, NullableOption, Option } from './functional'

export type OnSome<T, R> = Mapper<T, R>

export type OnNone<R> = () => R

export function isSome<T>(v: Option<T>): v is T & {} {
  return v !== undefined && v !== null
}

function map<T, U>(transform: Mapper<T, U>): (option: NullableOption<T>) => Option<U> {
  return (option) => (isSome(option) ? transform(option) : undefined)
}

function awaitFlatMap<T, U>(
  transform: (val: T) => Promise<Option<U>>
): (option: Option<T>) => Promise<Option<U>> {
  return (result) => (result ? transform(result) : Promise.resolve(undefined))
}

function nullToUndefined<T>(v: NullableOption<T>): Option<T> {
  return isSome(v) ? v : undefined
}

type NullableOptionNowOrLater<T> = NullableOption<Promise<NullableOption<T>>>

// Wrapper class for a Promise<Option> utility
class PromisedOptionBox<T> {
  constructor(private readonly v: NullableOptionNowOrLater<T>) {}

  then<R>(onSome: OnSome<T, R>): PromisedOptionBox<R> {
    return O.after(this.v?.then(map(onSome)))
  }

  async get(): Promise<Option<T>> {
    return this.v?.then(nullToUndefined)
  }

  async await(): Promise<OptionBox<T>> {
    return this.v?.then($O) ?? Promise.resolve(OptionBox.empty())
  }
}

// Wrapper class for an Option utility
export class OptionBox<T> {
  constructor(private readonly v: NullableOption<T>) {}

  static empty<T>(): OptionBox<T> {
    return new OptionBox<T>(undefined)
  }

  orElse(fallback: T): T {
    return isSome(this.v) ? this.v : fallback
  }

  do(onSome: (_: T) => void) {
    if (this.v) {
      onSome(this.v)
    }
  }

  map<R>(onSome: OnSome<T, R>): OptionBox<R> {
    return $O(map(onSome)(this.v))
  }

  flatMap<R>(onSome: OnSome<T, Option<R>>): OptionBox<R> {
    return $O(map(onSome)(this.v))
  }

  update<R>(onSome: OnSome<T, OptionBox<R>>): OptionBox<R> {
    return this.v ? onSome(this.v) : (this as unknown as OptionBox<R>) // v is null/undefined, so reuse the same object
  }

  awaitFlatMap<R>(onSome: OnSome<T, Promise<Option<R>>>): PromisedOptionBox<R> {
    return O.after(isSome(this.v) ? onSome(this.v) : undefined)
  }

  get(): T | undefined {
    return isSome(this.v) ? this.v : undefined
  }

  getPromise(): Promise<T | undefined> {
    return Promise.resolve(isSome(this.v) ? this.v : undefined)
  }
}

export function $O<T>(v: T | undefined | null): OptionBox<T> {
  return new OptionBox(v)
}

export const O = {
  map,
  awaitFlatMap,
  after: <T>(v: NullableOptionNowOrLater<T>) => new PromisedOptionBox(v),
}
