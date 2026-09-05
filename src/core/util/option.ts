import { Mapper, NullableOption, OnOk, Option, Result } from './functional'

// Terms:
// Map - if present,

export function isSome<T>(v: Option<T>): v is T & {} {
  return v !== undefined && v !== null
}

function map<T, U>(transform: Mapper<T, U>): (option: NullableOption<T>) => Option<U> {
  return (option) => (isSome(option) ? transform(option) : undefined)
}

function tryMap<Type1, Type2, Error>(
  transform: Mapper<Type1, Result<Type2, Error>>
): (option: NullableOption<Type1>) => Option<Result<Type2, Error>> {
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

  then<R>(onOk: OnOk<T, R>): PromisedOptionBox<R> {
    return O.after(this.v?.then(map(onOk)))
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

  map<R>(onOk: OnOk<T, R> | OnOk<T, Option<R>>): OptionBox<R> {
    return $O(map(onOk)(this.v))
  }

  tryMap<R, E>(onOk: OnOk<T, Result<R, E>>): OptionBox<R> {
    return $O(tryMap(onOk)(this.v))
  }

  awaitFlatMap<R>(onOk: OnOk<T, Promise<Option<R>>>): PromisedOptionBox<R> {
    return O.after(isSome(this.v) ? onOk(this.v) : undefined)
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
