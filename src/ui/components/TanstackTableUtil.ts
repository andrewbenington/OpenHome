import { SortableColumn, SortableValue } from '@openhome-core/util/sort'
import {
  ColumnDef,
  columnFilteringFeature,
  columnSizingFeature,
  createPaginatedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  tableFeatures,
} from '@tanstack/react-table'

export const TABLE_FEATURES = tableFeatures({
  columnSizingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

export function toTanstackColumn<T extends SortableValue>(
  rdgColumn: SortableColumn<T>
): ColumnDef<typeof TABLE_FEATURES, T> {
  // console.log(rdgColumn.name, rdgColumn.width)
  return {
    id: rdgColumn.key,
    header: typeof rdgColumn.name === 'string' ? rdgColumn.name : rdgColumn.key,
    accessorFn: (row) => {
      try {
        return rdgColumn.key in row ? row[rdgColumn.key] : rdgColumn.getFilterValue?.(row)
      } catch (e) {
        return String(e)
      }
    },
    cell: (info) => {
      try {
        return rdgColumn.renderValue?.(info.row.original)
      } catch (e) {
        return String(e)
      }
    },
    size: rdgColumn.width ? parseInt(rdgColumn.width.slice(0, -3)) : undefined,
    minSize: rdgColumn.minWidth ?? undefined,
    maxSize: rdgColumn.maxWidth ?? undefined,
    // size: 10,
  }
}
