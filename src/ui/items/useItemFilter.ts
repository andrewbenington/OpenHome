import { useState } from 'react'
import { defaultFilter, ItemFilter } from './types'

export function useItemFilter() {
  const [filter, setFilter] = useState<ItemFilter>(defaultFilter)

  function updateFilter(updates: Partial<ItemFilter>) {
    setFilter({ ...filter, ...updates })
  }

  return { filter, updateFilter }
}

export type ItemFilterController = ReturnType<typeof useItemFilter>
