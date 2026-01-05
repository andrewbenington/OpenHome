export type PartitionedResults<A, E> = { successes: A[]; failures: E[] }

export function partitionResults<A, E>(results: Result<A, E>[]) {
  const acc: PartitionedResults<A, E> = {
    failures: [],
    successes: [],
  }

  return results.reduce(partitionResultsRecursive, acc)
}

function partitionResultsRecursive<A, E>(acc: PartitionedResults<A, E>, result: Result<A, E>) {
  if (isErr(result)) {
    acc.failures.push(result.err)
  } else {
    acc.successes.push(result.value)
  }
  return acc
}

export function range(startOrSize: number, end?: number) {
  return end ? [...Array(end).keys()].slice(startOrSize) : [...Array(startOrSize).keys()]
}

// remove this after node 22 is lts
if (!Set.prototype.intersection) {
  Set.prototype.intersection = function (other) {
    const r = new Set()
    for (const v of this) if (other.has(v)) r.add(v)
    return r
  }
}

export function intersection<T>(first: T[] | undefined, second: T[]): T[] {
  const set1 = new Set(first)
  const set2 = new Set(second)
  return Array.from(set1.intersection(set2))
}

export function unique<T>(items: T[] | undefined): T[] {
  return Array.from(new Set(items))
}

// remove this after node 22 is lts
if (!Set.prototype.difference) {
  Set.prototype.difference = function (other) {
    const r = new Set()
    for (const v of this) if (!other.has(v)) r.add(v)
    return r
  }
}

export function difference<T>(first: T[] | undefined, second: T[]): T[] {
  const set1 = new Set(first)
  const set2 = new Set(second)
  return Array.from(set1.difference(set2))
}

export type Option<T> = T | undefined
export type Errorable<T> = Result<T, string>

function buildOk<T = never, E = never>(value: T): Result<T, E> {
  return { _tag: 'Ok', value }
}

function buildErr<T = never, E = never>(err: E): Result<T, E> {
  return { _tag: 'Err', err }
}

function isOk<T>(result: Result<T, unknown>): result is Ok<T> {
  return result._tag === 'Ok'
}

function isErr<E>(result: Result<unknown, E>): result is Err<E> {
  return result._tag === 'Err'
}

function map<T, E, U>(transform: (val: T) => U): (result: Result<T, E>) => Result<U, E> {
  return (result) => (isOk(result) ? buildOk(transform(result.value)) : result)
}

function mapErr<T, E, U>(transform: (val: E) => U): (result: Result<T, E>) => Result<T, U> {
  return (result) => (isErr(result) ? buildErr(transform(result.err)) : result)
}

function flatMap<T, E, U>(
  transform: (val: T) => Result<U, E>
): (result: Result<T, E>) => Result<U, E> {
  return (result) => (isErr(result) ? result : transform(result.value))
}

function asyncFlatMap<T, E, U>(
  transform: (val: T) => Promise<Result<U, E>>
): (result: Result<T, E>) => Promise<Result<U, E>> {
  return (result) => (isErr(result) ? Promise.resolve(result) : transform(result.value))
}

function match<T, E, R>(onOk: (val: T) => R, onErr: (val: E) => R): (result: Result<T, E>) => R {
  return (result) => (isOk(result) ? onOk(result.value) : onErr(result.err))
}

function fromNullable<E>(err: E): <T>(value: T | undefined) => Result<T, E> {
  return (value: any | undefined) => (value === undefined ? buildErr(err) : buildOk(value))
}

function buildStringErr<T = never>(err: any): Result<T, string> {
  return buildErr(String(err))
}

function tryPromise<T>(promise: Promise<T>): Promise<Result<T, string>> {
  return promise.then(buildOk).catch(buildStringErr)
}

export type Err<E> = {
  readonly _tag: 'Err'
  readonly err: E
}

export type Ok<T> = {
  readonly _tag: 'Ok'
  readonly value: T
}

export type Result<T, E> = Ok<T> | Err<E>

export const R = {
  match,
  map,
  mapErr,
  flatMap,
  asyncFlatMap,
  fromNullable,
  Ok: buildOk,
  Err: buildErr,
  isOk,
  isErr,
  tryPromise,
}
