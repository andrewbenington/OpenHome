import { R, Result } from '@openhome-core/util/functional'

export type RustResult<T, E> = RustOk<T> | RustErr<E>
export type RustOk<T> = { Ok: T }
export type RustErr<E> = { Err: E }

export function rustResultToEither<T, E>(result: RustResult<T, E>): Result<T, E> {
  return 'Ok' in result ? R.Ok(result.Ok) : R.Err(result.Err)
}

export function isRustErr<T, E>(result: RustResult<T, E>): result is RustErr<E> {
  return 'Err' in result
}
