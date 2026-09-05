type PartitionedResults<A, E> = { successes: A[]; failures: E[] }

export function partitionResults<A, E>(results: Result<A, E>[]) {
  const acc: PartitionedResults<A, E> = {
    failures: [],
    successes: [],
  }

  return results.reduce(partitionResultsRecursive, acc)
}

function partitionResultsRecursive<A, E>(acc: PartitionedResults<A, E>, result: Result<A, E>) {
  if (isErr(result)) {
    acc.failures.push(result.error)
  } else {
    acc.successes.push(result.data)
  }
  return acc
}

export function range(startOrSize: number, end?: number) {
  return end ? [...Array(end).keys()].slice(startOrSize) : [...Array(startOrSize).keys()]
}

export function unique<T>(items: T[] | undefined): T[] {
  return Array.from(new Set(items))
}

export function intersection<T>(first: T[] | undefined, second: T[]): T[] {
  const set1 = new Set(first)
  const set2 = new Set(second)
  return Array.from(set1.intersection(set2))
}

export function difference<T>(first: T[] | undefined, second: T[]): T[] {
  const set1 = new Set(first)
  const set2 = new Set(second)
  return Array.from(set1.difference(set2))
}

export type Option<T> = T | undefined
export type Nullable<T> = T | null
export type NullableOption<T> = T | null | undefined
export type Errorable<T> = Result<T, string>

type BooleanFn<Args extends unknown[] = unknown[]> = (...args: Args) => boolean

export function not<Args extends unknown[]>(f: BooleanFn<Args>) {
  return (...args: Args) => !f(...args)
}

export function buildOk<T = never, E = never>(value: T): Result<T, E> {
  return { status: 'ok', data: value }
}

export function buildErr<T = never, E = never>(err: E): Result<T, E> {
  return { status: 'error', error: err }
}

export function isOk<T>(result: Result<T, unknown>): result is Ok<T> {
  return result.status === 'ok'
}

export function isErr<E>(result: Result<unknown, E>): result is Err<E> {
  return result.status === 'error'
}

function map<T, E, U>(transform: Mapper<T, U>): (result: Result<T, E>) => Result<U, E> {
  return (result) => (isOk(result) ? buildOk(transform(result.data)) : result)
}

function mapErr<T, E, U>(transform: Mapper<E, U>): (result: Result<T, E>) => Result<T, U> {
  return (result) => (isErr(result) ? buildErr(transform(result.error)) : result)
}

function mapOr<T, E, U>(transform: Mapper<T, U>, fallback: U): (result: Result<T, E>) => U {
  return (result) => (isOk(result) ? transform(result.data) : fallback)
}

function orElse<T, E>(fallback: T): (result: Result<T, E>) => T {
  return (result) => (isOk(result) ? result.data : fallback)
}

function dropError<T, E>(result: Result<T, E>): Option<T> {
  return isOk(result) ? result.data : undefined
}

function err<T, E>(result: Result<T, E>): Option<E> {
  return isErr(result) ? result.error : undefined
}

function flatMap<T, E, U>(
  transform: (val: T) => Result<U, E>
): (result: Result<T, E>) => Result<U, E> {
  return (result) => (isErr(result) ? result : transform(result.data))
}

function asyncFlatMap<T, E, U>(
  transform: (val: T) => Promise<Result<U, E>>
): (result: Result<T, E>) => Promise<Result<U, E>> {
  return (result) => (isErr(result) ? Promise.resolve(result) : transform(result.data))
}

function match<T, E, R>(onOk: (val: T) => R, onErr: (val: E) => R): (result: Result<T, E>) => R {
  return (result) => (isOk(result) ? onOk(result.data) : onErr(result.error))
}

function fromNullable<E>(err: E): <T>(value: T | undefined) => Result<T, E> {
  return (value: any | undefined) => (value === undefined ? buildErr(err) : buildOk(value))
}

function buildStringErr<T = never>(err: any): Result<T, string> {
  return buildErr(String(err))
}

function tryFrom<T>(builder: () => T): Result<T, string> {
  try {
    return buildOk(builder())
  } catch (e) {
    return buildErr(String(e))
  }
}

function tryPromise<T>(promise: Promise<T>): Promise<Result<T, string>> {
  return promise.then(buildOk).catch(buildStringErr)
}

function assert<T, E>(result: Result<T, E>): T {
  if (isErr(result)) {
    throw new Error(String(result.error))
  }
  return result.data
}

export type Err<E> = {
  readonly status: 'error'
  readonly error: E
}

export type Ok<T> = {
  readonly status: 'ok'
  readonly data: T
}

export type Result<T, E = string> = Ok<T> | Err<E>

export function isResult<T, V>(v: object): v is Result<T, V> {
  return (
    v !== null &&
    'status' in v &&
    ((v.status === 'ok' && 'data' in v) || (v.status === 'error' && 'error' in v))
  )
}

export const R = {
  match,
  map,
  mapErr,
  mapOr,
  flatMap,
  asyncFlatMap,
  assert,
  orElse,
  dropError,
  err,
  fromNullable,
  Ok: buildOk,
  Err: buildErr,
  isOk,
  isErr,
  tryFrom,
  tryPromise,
}

export type Mapper<T, R> = (val: T) => R

export type OnOk<T, R> = Mapper<T, R>

export type OnErr<E, R> = Mapper<E, R>

export class ResultBox<T, E> {
  constructor(private readonly r: Result<T, E>) {}

  match<U>(onOk: OnOk<T, U>, onErr: OnErr<E, U>): U {
    return match(onOk, onErr)(this.r)
  }

  map<U>(onOk: OnOk<T, U>): ResultBox<U, E> {
    return $R(map<T, E, U>(onOk)(this.r))
  }

  dropError() {
    return dropError(this.r)
  }

  err() {
    return err(this.r)
  }

  flatMap<U>(onOk: OnOk<T, Result<U, E>>) {
    return flatMap<T, E, U>(onOk)(this.r)
  }

  mapErr<U>(onErr: OnErr<E, U>) {
    return mapErr<T, E, U>(onErr)(this.r)
  }

  orElse(ifErr: T) {
    return orElse<T, E>(ifErr)(this.r)
  }
}

export function $R<T, E>(r: Result<T, E>): ResultBox<T, E> {
  return new ResultBox(r)
}
