import { SortableColumn, SortableValue } from '@openhome-core/util/sort'
import { Flex, Spinner } from '@radix-ui/themes'
import OhoButton from '../OhoButton'
import OhoFlex from '../OhoFlex'
import SortableDataGrid from '../SortableDataGrid'
import type { SearchController } from './controllers'
import './style.css'

interface SortableSearchProps<T extends SortableValue, SC extends SearchController<T>> {
  FormComponent: React.FunctionComponent<{ controller: SC }>
  controller: SC
  columns: SortableColumn<T>[]
  topRightComponent?: React.ReactNode
  onSelectedChange?: (selected: T | undefined) => void
}

export default function SortableSearch<T extends SortableValue, SC extends SearchController<T>>(
  props: SortableSearchProps<T, SC>
) {
  const { FormComponent, controller, columns, topRightComponent, onSelectedChange } = props
  const { reset, loading, results, selectedId, setSelectedId } = controller

  const updateSelected = (item: T) => {
    const itemId = controller.getRowId(item)
    const newSelectedId = selectedId === itemId ? undefined : itemId
    setSelectedId(newSelectedId)
    onSelectedChange?.(selectedId === itemId ? undefined : item)
  }

  return (
    <Flex direction="column" gap="2" flexGrow="1" height="0">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          document.getElementById('search-button')?.click()
        }}
      >
        <Flex gap="2" pt="1" pb="1" align="start">
          <FormComponent controller={controller} />
          <OhoButton type="clear" onClick={reset} mt="1.5rem" />
          <OhoFlex.Spacer />
          {topRightComponent}
        </Flex>
      </form>
      // TODO: is this ugly/uncentered?
      {loading ? (
        <Spinner />
      ) : (
        <SortableDataGrid
          className="search-results-grid"
          rows={results ?? []}
          columns={columns}
          onCellClick={(props) => updateSelected(props.row)}
          rowKeyGetter={controller.getRowId}
          rowClass={(row) =>
            controller.getRowId(row) === selectedId ? 'search-row-selected' : undefined
          }
        />
      )}
    </Flex>
  )
}
