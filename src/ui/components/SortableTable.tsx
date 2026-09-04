import {
  numericSorter,
  SortableColumn,
  SortableValue,
  stringSorter,
} from '@openhome-core/util/sort'
import { cssClass } from '@openhome-ui/util/style'
import { Flex, Spinner } from '@radix-ui/themes'
import type { ColumnDef, ReactTable } from '@tanstack/react-table'
import { RefObject, useCallback, useMemo } from 'react'
import { type SortColumn } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Checkbox, Item, Label, OpenHomeCtxMenu, Separator, Submenu } from './context-menu'
import { DropdownArrowIcon, FilterIcon } from './Icons'
import { SortableDataGridProps } from './SortableDataGrid'
import './style.css'
import { TABLE_FEATURES } from './TanstackTableUtil'

// SortableColumn restricts 'width' to an rem value to ensure proper scaling,
// but here we need to be more permissive for compatibility with react-data-grid
type SortableColumnAnyWidth<T extends Record<string, unknown>> = Omit<
  SortableColumn<T>,
  'width'
> & {
  width?: string | number | undefined
}

export type TableController<R extends SortableValue> = ReactTable<typeof TABLE_FEATURES, R>
export type SortableTableColumn<R extends SortableValue> = ColumnDef<typeof TABLE_FEATURES, R>

export type SortableTableProps<R extends SortableValue> = {
  table: TableController<R>
  tableRef?: RefObject<HTMLDivElement | null>
  fetching?: 'prev' | 'next'
  onScrolledToBottom?: () => Promise<void>
  shouldLoadMore?: boolean
} & Omit<SortableDataGridProps<R>, 'columns' | 'rows'>

export default function SortableTable<R extends SortableValue>(props: SortableTableProps<R>) {
  const { className, table, tableRef, onScrolledToBottom } = props

  // console.log(sortedRows, filteredRows, rows)

  // The data grid library only accepts a row height in pixels, so we need to manually calculate it
  // based on the site ui scaling
  // const baseRowHeight = rowHeight ?? 28
  // const scalingVar = getComputedStyle(document.documentElement).getPropertyValue('--scaling').trim()
  // const scaling = parseFloat(scalingVar) || 1
  // const scaledRowHeight =
  //   typeof baseRowHeight === 'number'
  //     ? scaling * baseRowHeight
  //     : (row: NoInfer<R>) => scaling * baseRowHeight(row)

  const fetchMoreOnBottomReached = useCallback(async () => {
    if (tableRef?.current && onScrolledToBottom) {
      const { scrollHeight, scrollTop, clientHeight } = tableRef.current
      // once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
      if (scrollHeight - scrollTop - clientHeight < 400) {
        await onScrolledToBottom()
      }
    }
  }, [onScrolledToBottom, tableRef])

  // if (props.fetching) {
  //   console.info('table now fetching')
  //   return <Spinner />
  // }

  // 6. Render markup from the table instance APIs
  return (
    <div
      className={className}
      style={{ height: '100%', overflow: 'auto', textWrap: 'nowrap' }}
      ref={tableRef}
      onScroll={fetchMoreOnBottomReached}
    >
      <table className="datagrid">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ height: '1.75rem' }}>
              {headerGroup.headers.map((header, i) => {
                // const column = columns[i]
                return (
                  // <OpenHomeCtxMenu
                  //   key={header.id}
                  //   elements={buildHeaderContextMenu({
                  //     column,
                  //     columns,
                  //     // sortColumns,
                  //     // rows: currentPageRows,
                  //     // filters,
                  //     // setFilters,
                  //     // hiddenColumns,
                  //     // setHiddenColumns,
                  //   })}
                  // >

                  <th
                    key={header.id}
                    className="rdg-header-row"
                    colSpan={header.colSpan}
                    style={{
                      minWidth: `${header.column.columnDef.size}rem`,
                    }}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                  // </OpenHomeCtxMenu>
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
              {row.getAllCells().map((cell) => {
                return (
                  <td
                    className="rdg-cell"
                    key={cell.id}
                    onContextMenu={(e) =>
                      // TODO: fix types
                      props.onCellContextMenu?.({ row: cell.row.original } as any, e as any)
                    }
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                )
              })}
            </tr>
          ))}
          {props.shouldLoadMore && (
            <tr>
              <td colSpan={100} style={{ position: 'relative', height: '2rem' }}>
                <Spinner size="3" style={{ position: 'sticky', left: '50%' }} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

type HeaderWithContextMenuProps<R extends Record<string, unknown>> = {
  column: SortableColumnAnyWidth<R>
  columns: SortableColumnAnyWidth<R>[]
  sortColumns: SortColumn[]
  rows: readonly R[]
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

function buildHeaderContextMenu<R extends Record<string, unknown>>({
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

  const getFilterValue = buildFilterValueGetter(rows, column)

  const filterValues = getFilterValue
    ? Array.from(new Set(rows.map(getFilterValue))).filter(
        (val) => val !== null && val !== undefined
      )
    : []

  const sortDirection = sortColumns.find((s) => s.columnKey === column.key)?.direction

  const visibleColumnKeys = new Set(columns.map((c) => c.key)).difference(new Set(hiddenColumns))

  const getFilterValueDropdownPos = column.getFilterValueDropdownPos

  const filterDropdownSorter = getFilterValueDropdownPos
    ? numericSorter((val: string) => getFilterValueDropdownPos(val))
    : stringSorter((val: string) => val)

  const activeFilter = columnFilter !== undefined && columnFilter.length !== filterValues.length

  const headerCtxMenuBuilders = [
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
                      [columnKey]: filterValues.filter((otherValue) => filterValue !== otherValue),
                    })
                  } else if (columnFilter.includes(filterValue)) {
                    setFilters({
                      ...filters,
                      [columnKey]: columnFilter.filter((otherValue) => filterValue !== otherValue),
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
  ]

  return headerCtxMenuBuilders
}
