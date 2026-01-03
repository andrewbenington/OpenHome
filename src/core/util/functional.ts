import * as E from 'fp-ts/lib/Either'
import { Either, left, right } from 'fp-ts/lib/Either'

export type PartitionedEither<E, A> = { failures: E[]; successes: A[] }

export function partitionResults<E, A>(results: E.Either<E, A>[]) {
  const acc: PartitionedEither<E, A> = {
    failures: [],
    successes: [],
  }

  return results.reduce(partitionResultsRecursive, acc)
}

function partitionResultsRecursive<E, A>(acc: PartitionedEither<E, A>, either: E.Either<E, A>) {
  if (E.isLeft(either)) {
    acc.failures.push(either.left)
  } else {
    acc.successes.push(either.right)
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
export type Errorable<T> = Either<string, T>
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

  public match(onOk: (value: T) => void, onErr: (error: E) => void): void {
    E.match(onErr, onOk)(this.container)
  }

  public async matchAsync(
    onOk: (value: T) => Promise<void>,
    onErr: (error: E) => Promise<void>
  ): Promise<void> {
    return await E.match(onErr, onOk)(this.container)
  }

  public map<U>(f: (value: T) => U): Result<U, E> {
    return new Result<U, E>(E.map(f)(this.container))
  }
}

export function Err<T, E>(inner: E) {
  return Result.Err<T, E>(inner)
}

export function Ok<T, E>(inner: T) {
  return Result.Ok<T, E>(inner)
}

export function matches<T>(value: T | undefined) {
  return (other: T | undefined) => other === value
}
