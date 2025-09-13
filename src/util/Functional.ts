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
