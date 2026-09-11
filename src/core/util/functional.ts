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

function peekErr<T, E>(onErr: (error: E) => void): (result: Result<T, E>) => Result<T, E> {
  return (result) => {
    if (isErr(result)) onErr(result.error)
    return result
  }
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

// A Result that may still be in flight. Unlike Option, a Result always carries a
// definite ok/error status, so there's no "nothing yet" state to fold in here the
// way PromisedOptionBox does with null/undefined - it's just "now" or "later".
type ResultNowOrLater<T, E> = Result<T, E> | Promise<Result<T, E>>

// Wrapper class for a Promise<Result> utility
export class PromisedResultBox<T, E = string> {
  constructor(private readonly v: ResultNowOrLater<T, E>) {}

  static ok<T = never, E = never>(value: T): PromisedResultBox<T, E> {
    return new PromisedResultBox(Promise.resolve(R.Ok(value)))
  }

  then<U>(onOk: OnOk<T, U>): PromisedResultBox<U, E> {
    return R.after(Promise.resolve(this.v).then(map<T, E, U>(onOk)))
  }

  andThen<U>(onOk: (v: T) => Promise<U>): PromisedResultBox<U, E> {
    return R.after(
      Promise.resolve(this.v).then(
        R.match(
          async (value) => R.Ok(await onOk(value)),
          (error) => Promise.resolve(R.Err(error))
        )
      )
    )
  }

  catch<U>(onErr: OnErr<E, U>): PromisedResultBox<T, U> {
    return R.after(Promise.resolve(this.v).then(mapErr<T, E, U>(onErr)))
  }

  thenFlatMap<U>(onOk: OnOk<T, Promise<Result<U, E>>>): PromisedResultBox<U, E> {
    return R.after(
      Promise.resolve(this.v).then((result) =>
        isErr(result) ? Promise.resolve(result) : onOk(result.data)
      )
    )
  }

  async get(): Promise<Result<T, E>> {
    return this.v
  }

  async getBoxed(): Promise<ResultBox<T, E>> {
    return Promise.resolve(this.v).then($R)
  }
}

export const R = {
  match,
  map,
  mapErr,
  peekErr,
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
  after: <T, E>(v: ResultNowOrLater<T, E>) => new PromisedResultBox<T, E>(v),
}

export type Mapper<T, R> = (val: T) => R

export type OnOk<T, R> = Mapper<T, R>

export type OnErr<E, R> = Mapper<E, R>

export class ResultBox<T, E> {
  constructor(private readonly r: Result<T, E>) {}

  static ok<T = never, E = never>(value: T): ResultBox<T, E> {
    return $R<T, E>(buildOk(value))
  }

  static err<T = never, E = never>(error: E): ResultBox<T, E> {
    return $R<T, E>(buildErr(error))
  }

  match<U>(onOk: OnOk<T, U>, onErr: OnErr<E, U>): U {
    return match(onOk, onErr)(this.r)
  }

  map<U>(onOk: OnOk<T, U>): ResultBox<U, E> {
    return $R(map<T, E, U>(onOk)(this.r))
  }

  do(task: (v: T) => void): ResultBox<T, E> {
    if (isOk(this.r)) {
      task(this.r.data)
    }
    return this
  }

  doErr(task: (e: E) => void): ResultBox<T, E> {
    if (isErr(this.r)) {
      task(this.r.error)
    }
    return this
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

  // Like flatMap, but stays in ResultBox-land so you can keep chaining .map/.do/etc.
  // without unwrapping to a raw Result first.
  update<U>(onOk: OnOk<T, ResultBox<U, E>>): ResultBox<U, E> {
    return isOk(this.r) ? onOk(this.r.data) : (this as unknown as ResultBox<U, E>)
  }

  // Chains an async operation off the ok channel, short-circuiting on error.
  awaitFlatMap<U>(onOk: OnOk<T, Promise<Result<U, E>>>): PromisedResultBox<U, E> {
    return R.after(isErr(this.r) ? Promise.resolve(this.r) : onOk(this.r.data))
  }

  mapErr<U>(onErr: OnErr<E, U>) {
    return new ResultBox(mapErr<T, E, U>(onErr)(this.r))
  }

  peekErr(onErr: (error: E) => void) {
    return peekErr(onErr)(this.r)
  }

  orElse(ifErr: T) {
    return orElse<T, E>(ifErr)(this.r)
  }

  // Throws if this is an error, otherwise returns the ok value.
  assert(): T {
    return assert(this.r)
  }

  get(): Result<T, E> {
    return this.r
  }
}

export function $R<T, E>(r: Result<T, E>): ResultBox<T, E> {
  return new ResultBox(r)
}
