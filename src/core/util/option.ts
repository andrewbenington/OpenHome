import { Mapper, NullableOption, OnOk, Option } from './functional'

export function isSome<T>(v: Option<T>): v is T & {} {
  return v !== undefined && v !== null
}

function map<T, U>(transform: Mapper<T, U>): (option: NullableOption<T>) => Option<U> {
  return (option) => (isSome(option) ? transform(option) : undefined)
}

function flatMap<T, U>(transform: Mapper<T, Option<U>>): (option: NullableOption<T>) => Option<U> {
  return (option) => (isSome(option) ? transform(option) : undefined)
}

// Wrapper function for an Option utility
export function $O<T>(v: T | undefined | null) {
  return {
    orElse: (fallback: T): T => (isSome(v) ? v : fallback),
    map: <R>(onOk: OnOk<T, R>) => $O(map(onOk)(v)),
    flatMap: <R>(onOk: OnOk<T, Option<R>>) => $O(flatMap(onOk)(v)),
    get: () => (isSome(v) ? v : undefined),
    getPromise: () => Promise.resolve(isSome(v) ? v : undefined),
  }
}

export const O = {
  map,
  flatMap,
}
