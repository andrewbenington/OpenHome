import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Filter, PaginatedPage, PaginationCursor } from '@openhome-core/tauri/spectaCommands'
import { $R, R } from '@openhome-core/util/functional'
import { OhpkmRowData, toRowData } from '@openhome-ui/ohpkmGrid'
import { useBanksAndBoxes } from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCreateAtom } from '@tanstack/react-store'
import { useMemo } from 'react'

export type Page = PaginatedPage<OhpkmRowData>

export function usePokemonTable(queryKey: string, filters: Filter[]) {
  const paginationAtom = useCreateAtom<PaginationCursor>({
    pageIndex: 0,
    pageSize: 100,
  })
  const ohpkmStore = useOhpkmStore()
  const { trackedMonsToRelease } = useSaves()
  const { findHomeLocation } = useBanksAndBoxes()

  function preloadOhpkmPage(page: PaginatedPage<OHPKM>): Page {
    return {
      ...page,
      results: page.results.map((mon) => toRowData(mon, findHomeLocation, trackedMonsToRelease)),
    }
  }

  const filtersKey = useMemo(
    () =>
      filters.map((filter) =>
        Object.entries(filter)
          .map(([key, value]) => `${key}-${value}`)
          .join(',')
      ),
    [filters]
  )

  const query = useInfiniteQuery({
    queryKey: [queryKey, paginationAtom.get().pageIndex, paginationAtom.get().pageSize, filtersKey],
    queryFn: async (d) => {
      const pageParam = paginationAtom.get() ?? d.pageParam
      const searchPromise = ohpkmStore.searchStore(pageParam, filters).then(R.map(preloadOhpkmPage))
      return await searchPromise
    },
    initialPageParam: { pageIndex: 0, pageSize: 300 },
    getNextPageParam: (lastPage) => {
      return $R(lastPage).match(
        (page) => page.nextCursor,
        (e) => {
          console.error(e)
          return paginationAtom.get()
        }
      )
    },
  })

  const { data, fetchNextPage, isFetching } = query

  // flatten the array of arrays from the useInfiniteQuery hook
  const currentRows = useMemo(() => {
    return data?.pages.filter(R.isOk).flatMap((page) => page.data.results) ?? []
  }, [data])

  const totalRowCount = data?.pages.find((result) => R.isOk(result))?.data.totalCount ?? 0

  const totalFetched = currentRows.length

  // called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = async () => {
    if (isFetching || totalFetched >= totalRowCount) {
      return
    }
    await fetchNextPage()
  }

  return { currentRows, fetchMoreOnBottomReached, query, totalRowCount, paginationAtom }
}
