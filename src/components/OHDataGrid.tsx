import { ReactNode, RefAttributes, useEffect, useMemo, useState } from 'react'
import DataGrid, { Column, DataGridHandle, DataGridProps, SortColumn } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import './components.css'

function sortRows<T>(rows: readonly T[], columns: SortableColumn<T>[], sortColumns: SortColumn[]) {
  if (sortColumns.length === 0) return rows
  const sortColumn = sortColumns[0]
  const colComparer = columns.find((col) => col.key === sortColumn.columnKey)?.sortFunction

  if (!colComparer) return rows
  const comparer =
    sortColumn.direction === 'ASC' ? colComparer : (a: T, b: T) => colComparer(a, b) * -1

  return comparer ? [...rows].sort(comparer) : rows
}

export type SortableColumn<T> = Column<T> & {
  sortFunction?: (a: T, b: T) => number
  readonly renderValue?: (value: T) => ReactNode
}

export type OHDataGridProps<R> = {
  columns: SortableColumn<R>[]
  defaultSort?: string
  defaultSortDir?: 'ASC' | 'DESC'
} & DataGridProps<R> &
  RefAttributes<DataGridHandle>

function sortableColumnToDGColumn<T>(col: SortableColumn<T>): Column<T> {
  const { renderValue } = col

  return {
    ...col,
    resizable: true,
    sortable: !!col.sortFunction,
    draggable: true,
    renderCell: renderValue ? (value) => renderValue(value.row) : col.renderCell,
  }
}

export default function OHDataGrid<R>(props: OHDataGridProps<R>) {
  const { rows, columns, defaultSort, defaultSortDir, ...otherProps } = props
  const [sortColumns, setSortColumns] = useState<SortColumn[]>(
    defaultSort ? [{ columnKey: defaultSort, direction: defaultSortDir ?? 'ASC' }] : []
  )

  const [reorderedColumns, setReorderedColumns] = useState(columns)

  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortColumns),
    [rows, columns, sortColumns]
  )

  useEffect(
    () =>
      setReorderedColumns(
        columns.sort(
          (a, b) =>
            reorderedColumns.findIndex((rCol) => rCol.key === a.key) -
            reorderedColumns.findIndex((rCol) => rCol.key === b.key)
        )
      ),
    [columns, reorderedColumns]
  )

  return (
    <DataGrid
      className="datagrid"
      rowHeight={45}
      style={{ fontSize: 12, height: 'inherit' }}
      {...otherProps}
      rows={sortedRows}
      columns={reorderedColumns.map(sortableColumnToDGColumn)}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
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
    />
  )
}
