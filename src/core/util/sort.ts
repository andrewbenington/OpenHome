import dayjs, { Dayjs } from 'dayjs'
import type { Column } from 'react-data-grid'
import { CssRemSize } from '../../ui/util/style'

export type Sorter<T> = (a: T, b: T) => number

export type SortType = 'string' | 'number' | 'dayjs' | 'boolean'

export type SortableColumn<T extends Record<string, unknown>> = (
  | (Column<T> & {
      sortFunction?: (a: T, b: T) => number
      sortType?: undefined
    })
  | (Column<T> & {
      key: keyof T
      sortFunction?: undefined
      sortType?: SortType
    })
) & {
  hideByDefault?: boolean
  disableCopy?: boolean
  noFilter?: boolean
  width?: CssRemSize
  getFilterValue?: (row: T) => string | undefined | null
}

export function stringSorter<T>(func: (val: T) => string | undefined | null) {
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

function boolToNumIfDefined(value: boolean | undefined): number | undefined {
  if (value === undefined) return undefined
  return value ? 1 : 0
}

export function booleanSorter<T>(func: (val: T) => boolean | undefined) {
  return (a: T, b: T) => {
    const numA = boolToNumIfDefined(func(a)) ?? Number.POSITIVE_INFINITY
    const numB = boolToNumIfDefined(func(b)) ?? Number.POSITIVE_INFINITY

    return numA - numB
  }
}

export function dayjsSorter<T>(func: (val: T) => Dayjs | undefined) {
  return (a: T, b: T) => {
    const dateA = func(a) ?? dayjs.unix(0)
    const dateB = func(b) ?? dayjs.unix(0)

    return dateA.diff(dateB)
  }
}

export function filterUndefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}
