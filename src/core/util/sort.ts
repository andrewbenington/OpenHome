export function stringSorter<T>(func: (val: T) => string | undefined) {
  return (a: T, b: T) => {
    const strA = func(a)
    const strB = func(b)

    if (!strA && !strB) return 0
    if (!strA) return Number.POSITIVE_INFINITY
    if (!strB) return Number.NEGATIVE_INFINITY
    return strA.localeCompare(strB)
  }
}

export function numericSorter<T>(func: (val: T) => number | undefined) {
  return (a: T, b: T) => {
    const numA = func(a) ?? Number.POSITIVE_INFINITY
    const numB = func(b) ?? Number.POSITIVE_INFINITY

    return numA - numB
  }
}

export function filterUndefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}
