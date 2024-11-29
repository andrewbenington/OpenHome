export type RustResult<T, E> = RustOk<T> | RustErr<E>;
export type RustOk<T> = { Ok: T };
export type RustErr<E> = { Err: E };
