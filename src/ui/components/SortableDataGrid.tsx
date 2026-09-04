import { PaginatedPage, PaginationCursor } from '@openhome-core/tauri/spectaCommands'
import { $R, Errorable } from '@openhome-core/util/functional'
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
import { useSettings } from '@openhome-ui/state/appInfo'
import { Flex } from '@radix-ui/themes'
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { Atom } from '@tanstack/react-store'
import { useTable } from '@tanstack/react-table'
import { isDayjs } from 'dayjs'
import {
  ReactNode,
  RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
} from 'react'
import {
  DataGrid,
  RenderCellProps,
  SELECT_COLUMN_KEY,
  type DataGridHandle,
  type DataGridProps,
  type RenderHeaderCellProps,
  type SortColumn,
} from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Checkbox, Item, Label, OpenHomeCtxMenu, Separator, Submenu } from './context-menu'
import { DropdownArrowIcon, FilterIcon } from './Icons'
import SortableTable, { TableController } from './SortableTable'
import './style.css'
import { TABLE_FEATURES, toTanstackColumn } from './TanstackTableUtil'

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

export type SortableDataGridProps<R extends SortableValue> = {
  columns: SortableColumn<R>[]
  defaultSort?: string
  defaultSortOrder?: 'ASC' | 'DESC'
  paginationAtom?: Atom<PaginationCursor>
  dataQuery?: UseInfiniteQueryResult<InfiniteData<Errorable<PaginatedPage<R>>>>
  tableRef?: RefObject<HTMLDivElement | null>
  fetching?: 'prev' | 'next'
  onScrolledToBottom?: () => Promise<void>
  shouldLoadMore?: boolean
} & DataGridProps<R> &
  RefAttributes<DataGridHandle>

export default function SortableDataGrid<R extends SortableValue>(props: SortableDataGridProps<R>) {
  const {
    rows,
    columns,
    defaultSort,
    defaultSortOrder,
    rowHeight,
    defaultColumnOptions,
    className,
    onScrolledToBottom,
    tableRef,
    ...otherProps
  } = props
  const [sortColumns, setSortColumns] = useState<SortColumn[]>(
    defaultSort ? [{ columnKey: defaultSort, direction: defaultSortOrder ?? 'ASC' }] : []
  )
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(
    columns.filter((col) => col.hideByDefault).map((col) => col.key) ?? []
  )
  const [filters, setFilters] = useState<Filters<R>>({})

  const [reorderedColumns, setReorderedColumns] = useState(columns)
  const gridRef = useRef<DataGridHandle | null>(null)

  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortColumns),
    [rows, columns, sortColumns]
  )

  const filteredRows = useMemo(
    () => filterRows(sortedRows, columns, filters),
    [sortedRows, filters, columns]
  )

  // The data grid library only accepts a row height in pixels, so we need to manually calculate it
  // based on the site ui scaling
  const baseRowHeight = rowHeight ?? 28
  const scalingVar = getComputedStyle(document.documentElement).getPropertyValue('--scaling').trim()
  const scaling = parseFloat(scalingVar) || 1
  const scaledRowHeight =
    typeof baseRowHeight === 'number'
      ? scaling * baseRowHeight
      : (row: NoInfer<R>) => scaling * baseRowHeight(row)

  const modifiedColumns = useMemo(
    () =>
      reorderedColumns
        .filter((col) => !hiddenColumns.includes(col.key))
        .map((col) =>
          col.key === SELECT_COLUMN_KEY
            ? col
            : {
                ...col,
                resizable: true,
                sortable: !!(col.sortType ?? col.sortFunction),
                draggable: true,
                renderCell: hasRenderValueMethod(col)
                  ? (value: RenderCellProps<R>) => col.renderValue(value.row)
                  : col.renderCell,
                renderHeaderCell: (props: RenderHeaderCellProps<R>) => (
                  <HeaderWithContextMenu
                    column={props.column}
                    columns={columns}
                    sortColumns={sortColumns}
                    rows={sortedRows}
                    filters={filters}
                    setFilters={setFilters}
                    hiddenColumns={hiddenColumns}
                    setHiddenColumns={setHiddenColumns}
                  />
                ),
              }
        ),
    [columns, filters, hiddenColumns, reorderedColumns, sortColumns, sortedRows]
  )

  const fetchMoreOnBottomReached = useCallback(async () => {
    console.log('fetching more', gridRef.current)
    if (gridRef?.current?.element && onScrolledToBottom) {
      const { scrollHeight, scrollTop, clientHeight } = gridRef.current.element
      // once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
      if (scrollHeight - scrollTop - clientHeight < 400) {
        await onScrolledToBottom()
      }
    }
  }, [onScrolledToBottom, gridRef])

  const { settings } = useSettings()

  if (settings.tableType === 'tanstack') {
    return <TanstackTable {...props} />
  }

  return (
    <div
      className={className}
      style={{ height: '100%', overflow: 'hidden ', flex: 1 }}
      ref={tableRef}
    >
      <DataGrid
        ref={gridRef}
        className="datagrid"
        {...dataGridProps}
        {...otherProps}
        rowHeight={scaledRowHeight}
        rows={filteredRows}
        columns={modifiedColumns}
        sortColumns={sortColumns}
        onSortColumnsChange={(params) => setSortColumns(params)}
        onColumnsReorder={(col1, col2) => {
          const movedColumnIdx = reorderedColumns.findIndex((col) => col.key === col1)
          const targetColumnIdx = reorderedColumns.findIndex((col) => col.key === col2)
          const newColumns = [...reorderedColumns]
          const movedColumn = newColumns.splice(movedColumnIdx, 1)[0]

          setReorderedColumns([
            ...newColumns.slice(0, targetColumnIdx),
            movedColumn,
            ...newColumns.slice(targetColumnIdx),
          ])
        }}
        defaultColumnOptions={{ ...defaultColumnOptions, minWidth: 30 }}
        style={{ fontSize: 12, height: 'inherit', ...otherProps.style }}
        onScroll={fetchMoreOnBottomReached}
      />
    </div>
  )
}

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

function TanstackTable<R extends SortableValue>(props: SortableDataGridProps<R>) {
  const atom = props.paginationAtom?.get()
  const currentPageIndex = atom?.pageIndex
  const currentPage = currentPageIndex !== undefined ? props.dataQuery?.data?.pages[0] : undefined
  const currentPageRows = currentPage
    ? $R(currentPage).match(
        (result) => result.results,
        (e) => {
          console.error(e)
          return []
        }
      )
    : []

  // 5. Create the table instance
  const table: TableController<R> = useTable({
    key: 'person-table', // needed for devtools, omit if you don't want to use the devtools
    features: TABLE_FEATURES,
    columns: props.columns.filter((col) => col.key !== 'rdg-select-column').map(toTanstackColumn),
    atoms: { pagination: props.paginationAtom },
    data: currentPageRows,
    // onPaginationChange: (e) => console.dir(e),
    // rowCount: dataQuery?.data?,
    manualPagination: true,
    pageCount: -1,
  })

  return <SortableTable {...props} table={table} />
}
