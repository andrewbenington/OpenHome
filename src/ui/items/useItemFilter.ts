import { useState } from 'react'

type ItemSort = 'category_and_index' | 'alphabetical'

type ItemFilter = {
  includeUnsupported: boolean
  includeEmpty: boolean
  includeUnobtained: boolean
  sort: ItemSort
}

const defaultFilter: ItemFilter = {
  includeEmpty: false,
  includeUnsupported: false,
  includeUnobtained: false,
  sort: 'category_and_index',
}

export function useItemFilter() {
  const [filter, setFilter] = useState<ItemFilter>(defaultFilter)

  function updateFilter(updates: Partial<ItemFilter>) {
    setFilter({ ...filter, ...updates })
  }

  return { filter, updateFilter }
}

export type ItemFilterController = ReturnType<typeof useItemFilter>
