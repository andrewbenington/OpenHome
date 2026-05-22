import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortTypes } from '@openhome-core/pkm/sort'
import { Option, range } from '@openhome-core/util/functional'
import { filterUndefined, numericSorter } from '@openhome-core/util/sort'
import {
  CtxMenuElementBuilder,
  Item,
  OpenHomeCtxMenu,
  Submenu as Submenu,
} from '@openhome-ui/components/context-menu'
import { RemoveIcon } from '@openhome-ui/components/Icons'
import { MonLocation } from '@openhome-ui/state/saves'
import { Button, Flex, Grid } from '@radix-ui/themes'
import { CSSProperties } from 'react'
import { includeClass } from 'src/ui/util/style'
import { SimpleOpenHomeBox } from '../../../core/save/util/storage'
import {
  boxNameOrDefault,
  OPENHOME_BOX_COLUMNS,
  OPENHOME_BOX_ROWS,
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '../../state-zustand/banks-and-boxes/store'
import DroppableSpace from './DroppableSpace'

export default function AllHomeBoxes(props: {
  onBoxSelect: (index: number) => void
  moving?: boolean
  deleting?: boolean
  debugMode?: boolean
}) {
  const { onBoxSelect, moving, deleting, debugMode } = props
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const { indexOfBoxIdCurrentBank, getCurrentBank, reorderBoxesCurrentBank } = useBanksAndBoxes()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!active || !over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    const activeIndex = indexOfBoxIdCurrentBank(activeId)
    const overIndex = indexOfBoxIdCurrentBank(overId)

    if (activeIndex === undefined || overIndex === undefined) {
      return
    }

    const newOrderIndices = calculateNewBoxOrder(
      activeIndex,
      overIndex,
      getCurrentBank().boxes.size
    )
    const newOrderIds = newOrderIndices
      .map((index) => getCurrentBank().boxes.get(index)?.id)
      .filter(filterUndefined)

    reorderBoxesCurrentBank(newOrderIds)
  }

  const currentBoxesOrdered = Array.from(getCurrentBank().boxes.values()).toSorted(
    numericSorter((box) => box.index)
  )

  return (
    <OpenHomeCtxMenu elements={useSaveContextActions()}>
      <Grid columns="6" gap="1" overflowY="auto" maxHeight="80%">
        {moving ? (
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement]}
          >
            <SortableContext
              items={currentBoxesOrdered.map((box) => box.id) ?? []}
              strategy={rectSortingStrategy}
            >
              {currentBoxesOrdered.map((box) => (
                <DraggableBoxOverview
                  key={box.id}
                  box={box}
                  onBoxSelect={() => onBoxSelect(box.index)}
                  debugMode={debugMode}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          currentBoxesOrdered.map((box) => (
            <ClickableBoxOverview
              key={box.id}
              box={box}
              onBoxSelect={() => onBoxSelect(box.index)}
              debugMode={debugMode}
              deleting={deleting}
            />
          ))
        )}
      </Grid>
    </OpenHomeCtxMenu>
  )
}

type BoxOverviewProps = {
  box: SimpleOpenHomeBox
  onBoxSelect: () => void
  debugMode?: boolean
  deleting?: boolean
}

function ClickableBoxOverview({ box, onBoxSelect, debugMode, deleting }: BoxOverviewProps) {
  const { getCurrentBank, firstHomeBoxEmptySlot, deleteBoxCurrentBank } = useBanksAndBoxes()

  const firstOpenIndex = firstHomeBoxEmptySlot(box.index)

  const boxHasMons = box.identifiers.size > 0

  const firstOpenLocation: Option<MonLocation> =
    firstOpenIndex !== undefined
      ? {
          bank: getCurrentBank().index,
          box: box.index,
          boxSlot: firstOpenIndex,
          isHome: true,
        }
      : undefined

  return (
    <DroppableSpace
      dropID={`box-${box.id}`}
      key={boxNameOrDefault(box)}
      dropData={firstOpenLocation}
      disabled={firstOpenIndex === undefined}
      style={{ justifyContent: undefined }}
    >
      <OpenHomeCtxMenu sections={useBoxContextActions(box)}>
        <div className="box-overview-container">
          <Button
            className="box-overview-button"
            variant="soft"
            onClick={onBoxSelect}
            disabled={deleting}
          >
            <BoxWithMons box={box} debugMode={debugMode} />
          </Button>
          {deleting && (
            <Button
              className="mini-button home-box-delete-button"
              style={{
                backgroundColor: boxHasMons ? 'var(--gray-6)' : undefined,
              }}
              variant="solid"
              color="red"
              radius="full"
              disabled={boxHasMons}
              onClick={() => deleteBoxCurrentBank(box.id)}
            >
              <RemoveIcon />
            </Button>
          )}
        </div>
      </OpenHomeCtxMenu>
    </DroppableSpace>
  )
}

function DraggableBoxOverview({ box, debugMode }: BoxOverviewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, active } =
    useSortable({ id: box.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  }

  const actions = useBoxContextActions(box)

  if (!box) return <div />

  return (
    <OpenHomeCtxMenu sections={actions}>
      <div
        ref={setNodeRef}
        className="box-overview-container"
        style={style}
        {...attributes}
        {...listeners}
      >
        <Button
          className="box-overview-button"
          variant="solid"
          style={{ cursor: active ? 'grabbing' : 'grab' }}
        >
          <BoxWithMons box={box} debugMode={debugMode} />
        </Button>
      </div>
    </OpenHomeCtxMenu>
  )
}

type BoxMonIconsProps = {
  box: SimpleOpenHomeBox
  debugMode?: boolean
}

function BoxWithMons({ box, debugMode }: BoxMonIconsProps) {
  const boxName = boxNameOrDefault(box)
  const allSlotsFull = box.identifiers.size === OPENHOME_BOX_SLOTS

  return (
    <Flex direction="column" width="100%" height="100%">
      <div className="box-icon-mon-container">
        {range(OPENHOME_BOX_COLUMNS).map((i) => (
          <div className="box-icon-mon-col" key={`pos-display-col-${i}`}>
            {range(OPENHOME_BOX_ROWS).map((j) => {
              const slotIsEmpty = !box.identifiers.has(j * OPENHOME_BOX_COLUMNS + i)
              return (
                <div
                  className={includeClass('box-icon-mon-indicator')
                    .with('box-icon-mon-empty')
                    .if(slotIsEmpty)}
                  key={`pos-display-cell-${i}-${j}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="box-overview-title-container" style={fontStyleFromStringLength(boxName)}>
        <div
          className={includeClass('box-overview-title')
            .with('box-overview-title-full')
            .if(allSlotsFull)}
        >
          {boxName}
        </div>
      </div>
      {debugMode && (
        <div style={{ fontWeight: 'lighter' }}>
          <div>Index: {box.index}</div>
          <div>{box.id.split('-')[0]}</div>
        </div>
      )}
    </Flex>
  )
}

function calculateNewBoxOrder(movedFromIndex: number, movedIntoIndex: number, boxCount: number) {
  if (movedFromIndex >= boxCount || movedIntoIndex >= boxCount) {
    return range(boxCount)
  }

  const movedUp = movedIntoIndex < movedFromIndex

  const before = range(movedIntoIndex).filter((index) => index !== movedFromIndex)
  const after = range(movedIntoIndex + 1, boxCount).filter((index) => index !== movedFromIndex)

  const newOrder = before

  if (movedUp) {
    newOrder.push(movedFromIndex)
    newOrder.push(movedIntoIndex)
  } else {
    newOrder.push(movedIntoIndex)
    newOrder.push(movedFromIndex)
  }
  newOrder.push(...after)

  return newOrder
}

function useSaveContextActions() {
  const { sortAllHomeBoxes, addBoxCurrentBank } = useBanksAndBoxes()
  return [
    Submenu.label('Sort all boxes...').with(
      ...SortTypes.map((sortType) =>
        Item.label(`By ${sortType}`).action(() => sortAllHomeBoxes(sortType))
      )
    ),
    Submenu.label('Add Box...').with(
      Item.label('Beginning').action(() => addBoxCurrentBank('start')),
      Item.label('End').action(() => addBoxCurrentBank('end'))
    ),
  ]
}

function useBoxContextActions(box: SimpleOpenHomeBox): CtxMenuElementBuilder[][] {
  const {
    removeDupesFromHomeBox,
    sortHomeBox,
    sortAllHomeBoxes,
    deleteBoxCurrentBank,
    addBoxCurrentBank,
  } = useBanksAndBoxes()
  const boxIsEmpty = box.identifiers.size === 0
  const boxActions = [
    Item.label('Remove duplicates from this box')
      .action(() => removeDupesFromHomeBox(box.index))
      .disabled(!boxIsEmpty),
    Submenu.label('Sort this box...')
      .with(
        ...SortTypes.map((sortType) =>
          Item.label(`By ${sortType}`).action(() => sortHomeBox(box.index, sortType))
        )
      )
      .disabled(boxIsEmpty),
    Submenu.label('Sort all boxes...').with(
      ...SortTypes.map((sortType) =>
        Item.label(`By ${sortType}`).action(() => sortAllHomeBoxes(sortType))
      )
    ),
    Item.label('Delete Box')
      .action(() => deleteBoxCurrentBank(box.id))
      .disabled(!boxIsEmpty),
  ]

  const addBoxActions = [
    Submenu.label('Add Box...').with(
      Item.label('Before').action(() => addBoxCurrentBank(['before', box.index])),
      Item.label('After').action(() => addBoxCurrentBank(['after', box.index])),
      Item.label('Beginning').action(() => addBoxCurrentBank('start')),
      Item.label('End').action(() => addBoxCurrentBank('end'))
    ),
  ]

  return [boxActions, addBoxActions]
}

function fontStyleFromStringLength(value: string): CSSProperties {
  return {
    fontSize: fontSizeFromStringLength(value.length),
    lineHeight: lineHeightFromStringLength(value.length),
  }
}

function fontSizeFromStringLength(length: number): `${number}rem` {
  if (length <= 10) {
    return '0.85rem'
  } else if (length <= 20) {
    return '0.75rem'
  } else if (length <= 50) {
    return '0.6rem'
  } else {
    return '0.5rem'
  }
}

function lineHeightFromStringLength(length: number): number {
  if (length <= 10) {
    return 1.5
  } else if (length <= 20) {
    return 1.3
  } else {
    return 1.2
  }
}
