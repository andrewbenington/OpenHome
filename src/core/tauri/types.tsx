export type RustResult<T, E> = RustOk<T> | RustErr<E>
export type RustOk<T> = { Ok: T }
export type RustErr<E> = { Err: E }

export function isRustErr<T, E>(result: RustResult<T, E>): result is RustErr<E> {
  return 'error' in result || 'Err' in result
}
