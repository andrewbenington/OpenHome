import * as E from 'fp-ts/lib/Either'

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

export type Option<T> = T | undefined
