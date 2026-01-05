import * as E from 'fp-ts/lib/Either'
import { Either, left, right } from 'fp-ts/lib/Either'

export type PartitionedResults<A, E> = { successes: A[]; failures: E[] }

export function partitionResults<A, E>(results: Result<A, E>[]) {
  const acc: PartitionedResults<A, E> = {
    failures: [],
    successes: [],
  }

  return results.reduce(partitionResultsRecursive, acc)
}

function partitionResultsRecursive<A, E>(acc: PartitionedResults<A, E>, result: Result<A, E>) {
  if (result.isErr()) {
    acc.failures.push(result.err)
  } else {
    acc.successes.push(result.ok!)
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

export class Result<T, E> {
  private container: Either<E, T>

  private constructor(container: Either<E, T>) {
    this.container = container
  }

  static Ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(right(value))
  }

  static Err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(left(error))
  }

  static handlePromise<T>(promise: Promise<T>): Promise<Result<T, string>> {
    return promise.then(Result.Ok<T, string>).catch((reason) => Result.Err(String(reason)))
  }

  public match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
    return E.match(onErr, onOk)(this.container)
  }

  public onOk(f: (value: T) => void) {
    this.match(f, () => {})
  }

  public map<U>(f: (value: T) => U): Result<U, E> {
    return new Result<U, E>(E.map(f)(this.container))
  }

  public flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    const applyAndGetContainer = (value: T) => f(value).container

    return new Result<U, E>(E.flatMap(applyAndGetContainer)(this.container))
  }

  public asyncFlatMap<U>(f: AsyncMapper<T, E, U>): Promise<Result<U, E>> {
    return applyAsyncMapper(this.container, f)
  }

  public get ok() {
    return E.isRight(this.container) ? this.container.right : undefined
  }

  public get err() {
    return E.isLeft(this.container) ? this.container.left : undefined
  }

  public isOk(): this is OkResult<T> {
    return E.isRight(this.container)
  }

  public isErr(): this is ErrResult<E> {
    return E.isLeft(this.container)
  }
}

type AsyncMapper<T, E, U> = (value: T) => Promise<Result<U, E>>

async function applyAsyncMapper<T, E, U>(
  input: Either<E, T>,
  mapper: AsyncMapper<T, E, U>
): Promise<Result<U, E>> {
  return E.isLeft(input) ? Err(input.left) : await mapper(input.right)
}

type OkResult<T> = Result<T, any> & { ok: T }

type ErrResult<E> = Result<any, E> & { err: E }

function Err<T, E>(inner: E) {
  return Result.Err<T, E>(inner)
}

function Ok<T, E>(inner: T) {
  return Result.Ok<T, E>(inner)
}

function match<T, E, R>(onOk: (val: T) => R, onErr: (val: E) => R): (result: Result<T, E>) => R {
  return (result) => result.match(onOk, onErr)
}

function map<T, E, U>(onOk: (val: T) => U): (result: Result<T, E>) => Result<U, E> {
  return (result) => result.map(onOk)
}

function isErr<T, E>(result: Result<T, E>) {
  return result.isErr()
}

export const R = {
  Err,
  Ok,
  match,
  map,
  isErr,
}
