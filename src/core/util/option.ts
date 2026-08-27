import { buildErr, buildOk, Mapper, NullableOption, OnOk, Option, Result } from './functional'

export function isSome<T>(v: Option<T>): v is T & {} {
  return v !== undefined && v !== null
}

function map<T, U>(transform: Mapper<T, U>): (option: NullableOption<T>) => Option<U> {
  return (option) => (isSome(option) ? transform(option) : undefined)
}

// Wrapper function for an Option utility
export function $O<T>(v: T | undefined | null) {
  return {
    orElse: <E>(error: E): Result<T, E> => (isSome(v) ? buildOk(v) : buildErr(error)),
    map: <R>(onOk: OnOk<T, R>) => $O(map(onOk)(v)),
    get: () => (isSome(v) ? v : undefined),
    getPromise: () => Promise.resolve(isSome(v) ? v : undefined),
  }
}

export const O = {
  map,
}
