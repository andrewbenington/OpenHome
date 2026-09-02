import {
  booleanSorter,
  dayjsSorter,
  numericSorter,
  SortableColumn,
  SortableValue,
  Sorter,
  SortType,
  stringSorter,
} from '@openhome-core/util/sort'
import { cssClass } from '@openhome-ui/util/style'
import { Flex } from '@radix-ui/themes'
import type { ColumnDef } from '@tanstack/react-table'
import { columnSizingFeature, tableFeatures, useTable } from '@tanstack/react-table'
import { isDayjs } from 'dayjs'
import { ReactNode, useMemo, useState } from 'react'
import { type SortColumn } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Checkbox, Item, Label, OpenHomeCtxMenu, Separator, Submenu } from './context-menu'
import { DropdownArrowIcon, FilterIcon } from './Icons'
import { SortableDataGridProps } from './SortableDataGrid'
import './style.css'

const dataGridProps = {
  rowHeight: '2.5rem',
  style: { height: '100%', fontSize: '0.9rem', overflow: 'auto' },
}

function sorterBySortType<T>(
  sortType: SortType,
  columnKey: string & keyof T
): Sorter<T> | undefined {
  switch (sortType) {
    case 'string':
      return stringSorter((row: T) => {
        const val = row[columnKey]

        return typeof val === 'string' ? val : undefined
      })
    case 'number':
      return numericSorter((row: T) => {
        const val = row[columnKey]

        return typeof val === 'number' ? val : undefined
      })
    case 'dayjs':
      return dayjsSorter((row: T) => {
        const val = row[columnKey]

        return isDayjs(val) ? val : undefined
      })
    case 'boolean':
      return booleanSorter((row: T) => {
        const val = row[columnKey]

        return typeof val === 'boolean' ? val : undefined
      })
    default:
      return undefined
  }
}

function sortRows<T extends SortableValue>(
  rows: readonly T[],
  columns: SortableColumn<T>[],
  sortColumns: SortColumn[]
) {
  return rows.toSorted((a, b) => {
    for (const sortParamColumn of sortColumns) {
      const column = columns.find((col) => col.key === sortParamColumn.columnKey)

      if (!column) continue

      let colComparer = column?.sortFunction

      if (column?.sortType) {
        const columnKey = column.key

        colComparer = sorterBySortType(column.sortType, columnKey)
      }

      if (colComparer) {
        const orderedComparer =
          sortParamColumn.direction === 'ASC'
            ? colComparer
            : (a: T, b: T) => (colComparer?.(a, b) ?? 0) * -1
        const comparison = orderedComparer(a, b)

        if (comparison !== 0) {
          return comparison
        }
      }
    }

    return 0
  })
}

function filterRows<T extends SortableValue>(
  rows: readonly T[],
  columns: SortableColumn<T>[],
  filters: Partial<Filters<T>>
) {
  function shouldShow(row: T) {
    for (const [colKey, values] of Object.entries(filters)) {
      const column = columns.find((c) => c.key === colKey)

      if (!column) continue
      const renderFilterItem = buildFilterValueGetter(rows, column)

      const filteredValue = renderFilterItem?.(row)

      if (filteredValue && values && !values.includes(filteredValue)) {
        return false
      }
    }

    return true
  }

  return rows.filter(shouldShow)
}

// SortableColumn restricts 'width' to an rem value to ensure proper scaling,
// but here we need to be more permissive for compatibility with react-data-grid
type SortableColumnAnyWidth<T extends Record<string, unknown>> = Omit<
  SortableColumn<T>,
  'width'
> & {
  width?: string | number | undefined
}

type Filters<T extends Record<string, any>> = Partial<{
  [K in keyof T]: string[]
}>

const TABLE_FEATURES = tableFeatures({ columnSizingFeature })

function toTanstackColumn<T extends SortableValue>(
  rdgColumn: SortableColumn<T>
): ColumnDef<typeof TABLE_FEATURES, T> {
  console.log(rdgColumn.name, rdgColumn.width)
  return {
    id: rdgColumn.key,
    header: typeof rdgColumn.name === 'string' ? rdgColumn.name : rdgColumn.key,
    accessorFn: (row) => {
      try {
        return rdgColumn.key in row ? row[rdgColumn.key] : rdgColumn.getFilterValue?.(row)
      } catch (e) {
        console.error(e)
        console.dir({ row, rdgColumn })
        return String(e)
      }
    },
    cell: (info) => {
      try {
        return rdgColumn.renderValue?.(info.row.original)
      } catch (e) {
        console.error(e)
        console.dir({ info, value: info.getValue() })
        return String(e)
      }
    },
    size: rdgColumn.width ? parseInt(rdgColumn.width.slice(0, -3)) : undefined,
    minSize: rdgColumn.minWidth ?? undefined,
    maxSize: rdgColumn.maxWidth ?? undefined,
    // size: 10,
  }
}

export default function SortableTable<R extends SortableValue>(props: SortableDataGridProps<R>) {
  const {
    rows,
    columns,
    defaultSort,
    defaultSortOrder,
    rowHeight,
    defaultColumnOptions,
    className,
    ...otherProps
  } = props
  const [sortColumns, setSortColumns] = useState<SortColumn[]>(
    defaultSort ? [{ columnKey: defaultSort, direction: defaultSortOrder ?? 'ASC' }] : []
  )
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(
    columns.filter((col) => col.hideByDefault).map((col) => col.key) ?? []
  )
  const [filters, setFilters] = useState<Filters<R>>({})

  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortColumns),
    [rows, columns, sortColumns]
  )

  const filteredRows = useMemo(
    () => filterRows(sortedRows, columns, filters),
    [sortedRows, filters, columns]
  )

  console.log(sortedRows, filteredRows, rows)

  // The data grid library only accepts a row height in pixels, so we need to manually calculate it
  // based on the site ui scaling
  const baseRowHeight = rowHeight ?? 28
  const scalingVar = getComputedStyle(document.documentElement).getPropertyValue('--scaling').trim()
  const scaling = parseFloat(scalingVar) || 1
  const scaledRowHeight =
    typeof baseRowHeight === 'number'
      ? scaling * baseRowHeight
      : (row: NoInfer<R>) => scaling * baseRowHeight(row)

  // 5. Create the table instance
  const table = useTable({
    key: 'person-table', // needed for devtools, omit if you don't want to use the devtools
    features: TABLE_FEATURES,
    columns: columns.filter((col) => col.key !== 'rdg-select-column').map(toTanstackColumn),
    data: filteredRows,
  })

  // 6. Render markup from the table instance APIs
  return (
    <div className={className} style={{ height: '100%', overflow: 'auto', flex: 1 }}>
      <table className="datagrid">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ height: '1.75rem' }}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    className="rdg-header-row"
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      width: `${header.column.columnDef.size}rem`,
                    }}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              className={cssClass('rdg-row')
                .with('rdg-row-even')
                .if(index % 2 === 0)
                .else('rdg-row-odd')
                .build()}
              key={row.id}
            >
              {row.getAllCells().map((cell, i) => {
                const column = columns[i + 1]
                return (
                  <td
                    // className='rdg-cell'
                    className={cssClass('rdg-cell')
                      .with(typeof column?.cellClass === 'string' ? column?.cellClass : undefined)
                      .build()}
                    key={cell.id}
                    style={{
                      minWidth: cell.column.columnDef.minSize ?? `${cell.column.columnDef.size}rem`,
                      width: `${cell.column.columnDef.size}rem`,
                      // display: 'table-cell',
                    }}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// return (
//   <div className={className} style={{ height: '100%', overflow: 'hidden ', flex: 1 }}>
//     <DataGrid
//       ref={gridRef}
//       className="datagrid"
//       {...dataGridProps}
//       {...otherProps}
//       rowHeight={scaledRowHeight}
//       rows={filteredRows}
//       columns={modifiedColumns}
//       sortColumns={sortColumns}
//       onSortColumnsChange={(params) => setSortColumns(params)}
//       onColumnsReorder={(col1, col2) => {
//         const movedColumnIdx = reorderedColumns.findIndex((col) => col.key === col1)
//         const targetColumnIdx = reorderedColumns.findIndex((col) => col.key === col2)
//         const newColumns = [...reorderedColumns]
//         const movedColumn = newColumns.splice(movedColumnIdx, 1)[0]

//         setReorderedColumns([
//           ...newColumns.slice(0, targetColumnIdx),
//           movedColumn,
//           ...newColumns.slice(targetColumnIdx),
//         ])
//       }}
//       defaultColumnOptions={{ ...defaultColumnOptions, minWidth: 30 }}
//       style={{ fontSize: 12, height: 'inherit', ...otherProps.style }}
//     />
//   </div>
// )
// }

function hasRenderValueMethod<T extends SortableValue>(
  col: SortableColumn<T>
): col is SortableColumn<T> & { renderValue: (value: T) => ReactNode } {
  return col.renderValue !== undefined
}

type HeaderWithContextMenuProps<R extends Record<string, unknown>> = {
  column: SortableColumnAnyWidth<R>
  columns: SortableColumnAnyWidth<R>[]
  sortColumns: SortColumn[]
  rows: R[]
  filters: Partial<Filters<R>>
  setFilters: (filters: Partial<Filters<R>>) => void
  hiddenColumns: string[]
  setHiddenColumns: (cols: string[]) => void
}

function buildFilterValueGetter<R extends Record<string, unknown>>(
  rows: readonly R[],
  column: SortableColumnAnyWidth<R>
) {
  if (column.noFilter) return undefined
  if (column.getFilterValue) return column.getFilterValue
  if (!rows.length || typeof rows[0][column.key] === 'object') return undefined
  if (!rows.some((row) => row[column.key])) return undefined

  return (row: R) => `${row[column.key]}`
}

function HeaderWithContextMenu<R extends Record<string, unknown>>({
  column,
  columns,
  sortColumns,
  rows,
  filters,
  setFilters,
  hiddenColumns,
  setHiddenColumns,
}: HeaderWithContextMenuProps<R>) {
  const columnKey: keyof R = column.key

  const columnFilter = filters[columnKey]

  const getFilterValue = useMemo(() => buildFilterValueGetter(rows, column), [rows, column])

  const filterValues = useMemo(
    () =>
      getFilterValue
        ? Array.from(new Set(rows.map(getFilterValue))).filter(
            (val) => val !== null && val !== undefined
          )
        : [],
    [getFilterValue, rows]
  )

  const sortDirection = sortColumns.find((s) => s.columnKey === column.key)?.direction

  const visibleColumnKeys = useMemo(
    () => new Set(columns.map((c) => c.key)).difference(new Set(hiddenColumns)),
    [columns, hiddenColumns]
  )

  const getFilterValueDropdownPos = column.getFilterValueDropdownPos

  const filterDropdownSorter = getFilterValueDropdownPos
    ? numericSorter((val: string) => getFilterValueDropdownPos(val))
    : stringSorter((val: string) => val)

  const activeFilter = columnFilter !== undefined && columnFilter.length !== filterValues.length

  const headerCtxMenuBuilders = useMemo(
    () => [
      Label.component(column.name),
      Separator,
      getFilterValue
        ? Submenu.label('Filter...')
            .with(
              Item.label(activeFilter ? 'Select All' : 'Deselect All').action(() =>
                setFilters({
                  ...filters,
                  [columnKey]: activeFilter ? undefined : [],
                })
              )
            )
            .with(
              ...filterValues.toSorted(filterDropdownSorter).map((filterValue) =>
                Checkbox.label(filterValue)
                  .handleValueChanged(() => {
                    if (columnFilter === undefined) {
                      setFilters({
                        ...filters,
                        [columnKey]: filterValues.filter(
                          (otherValue) => filterValue !== otherValue
                        ),
                      })
                    } else if (columnFilter.includes(filterValue)) {
                      setFilters({
                        ...filters,
                        [columnKey]: columnFilter.filter(
                          (otherValue) => filterValue !== otherValue
                        ),
                      })
                    } else {
                      setFilters({
                        ...filters,
                        [columnKey]: [...columnFilter, filterValue],
                      })
                    }
                  })
                  .handleIsChecked(() => !columnFilter || columnFilter.includes(filterValue))
              )
            )
        : undefined,
      getFilterValue ? Item.label('Clear Filters').action(() => setFilters({})) : undefined,
      getFilterValue ? Separator : undefined,
      Submenu.label('Show/Hide Columns').with(
        ...columns
          .filter((col) => !!col.name)
          .map((col) =>
            Checkbox.component(col.name)
              .handleValueChanged(() => {
                if (visibleColumnKeys.has(col.key)) {
                  if (visibleColumnKeys.size > 1) {
                    setHiddenColumns([...hiddenColumns, col.key])
                  }
                } else {
                  setHiddenColumns([...hiddenColumns.filter((k) => k !== col.key)])
                }
              })
              .handleIsChecked(() => visibleColumnKeys.has(col.key))
          )
      ),
      Item.label('Reset to Default').action(() =>
        setHiddenColumns(columns.filter((c) => c.hideByDefault).map((c) => c.key))
      ),
    ],
    [
      activeFilter,
      column.name,
      columnFilter,
      columnKey,
      columns,
      filterDropdownSorter,
      filterValues,
      filters,
      getFilterValue,
      hiddenColumns,
      setFilters,
      setHiddenColumns,
      visibleColumnKeys,
    ]
  )

  return (
    <OpenHomeCtxMenu elements={headerCtxMenuBuilders}>
      <Flex align="center" height="100%" mr="-1">
        <Flex style={{ width: 0, flex: 1, overflow: 'hidden' }}>
          {typeof column.name === 'string' ? (
            <div style={{ height: '100%', display: 'grid', alignItems: 'center' }}>
              {column.name}
            </div>
          ) : (
            column.name
          )}
          {activeFilter && (
            <FilterIcon color="var(--focus-11)" style={{ minWidth: '1rem', height: '1rem' }} />
          )}
        </Flex>
        {sortDirection && (
          <DropdownArrowIcon
            size="18px"
            style={{
              rotate: sortDirection === 'DESC' ? '180deg' : undefined,
              transition: 'rotate 0.15s',
              minWidth: '1rem',
            }}
          />
        )}
      </Flex>
    </OpenHomeCtxMenu>
  )
}
