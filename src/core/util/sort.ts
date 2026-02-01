import { OriginGame, OriginGames } from '@pkm-rs/pkg'
import dayjs, { Dayjs } from 'dayjs'
import { ReactNode } from 'react'
import type { Column } from 'react-data-grid'
import { CssRemSize } from '../../ui/util/style'

export type Sorter<T> = (a: T, b: T) => number

export type SortType = 'string' | 'number' | 'dayjs' | 'boolean'

export type SortableValue = Record<string, any>

export type SortableColumn<T extends SortableValue> = Readonly<
  (
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
    renderValue?: (value: T) => ReactNode
  }
>

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

function originGameOrderValue(origin?: OriginGame): number {
  if (!origin) return Number.POSITIVE_INFINITY

  // GameBoy games have origins between Gen 6 and 7, so this is necessary to make the order chronological
  if (OriginGames.isGameboy(origin)) {
    return origin
  }

  return origin + OriginGame.Crystal
}

export function gameSorter<T>(func: (val: T) => OriginGame | undefined) {
  return (a: T, b: T) => {
    const numA = originGameOrderValue(func(a)) ?? Number.POSITIVE_INFINITY
    const numB = originGameOrderValue(func(b)) ?? Number.POSITIVE_INFINITY

    return numA - numB
  }
}

export function gameOrPluginSorter<T>(
  getOrigin: (val: T) => OriginGame | undefined,
  getPluginId: (val: T) => string | undefined
) {
  return multiSorter(
    gameSorter(getOrigin),
    stringSorter((val) => getPluginId(val) ?? '.') // so official games come before plugins
  )
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

export function multiSorter<T>(...sorters: Sorter<T>[]): Sorter<T> {
  return (a: T, b: T) => {
    for (const sorter of sorters) {
      const diff = sorter(a, b)

      if (diff !== 0) return diff
    }
    return 0
  }
}

export function filterUndefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}
