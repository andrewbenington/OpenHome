import * as E from 'fp-ts/lib/Either'

export type RustResult<T, E> = RustOk<T> | RustErr<E>
export type RustOk<T> = { Ok: T }
export type RustErr<E> = { Err: E }

export function rustResultToEither<T, E>(result: RustResult<T, E>): E.Either<E, T> {
  return 'Ok' in result ? E.right(result.Ok) : E.left(result.Err)
}

export function isErr<T, E>(result: RustResult<T, E>): result is RustErr<E> {
  return 'Err' in result
}
