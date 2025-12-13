import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortTypes } from '@openhome/core/pkm/sort'
import { HomeBox, HomeData } from '@openhome/core/save/HomeData'
import { SavesAndBanksManager, useSaves } from '@openhome/ui/state/saves/useSaves'
import { Button, Flex, Grid } from '@radix-ui/themes'
import { CSSProperties } from 'react'
import OpenHomeCtxMenu from 'src/ui/components/context-menu/OpenHomeCtxMenu'
import {
  CtxMenuElementBuilder,
  ItemBuilder,
  SubmenuBuilder,
} from 'src/ui/components/context-menu/types'
import { RemoveIcon } from 'src/ui/components/Icons'
import { range } from 'src/util/Functional'
import { filterUndefined } from 'src/util/Sort'
import DroppableSpace from './DroppableSpace'

export default function AllHomeBoxes(props: {
  onBoxSelect: (index: number) => void
  moving?: boolean
  deleting?: boolean
  debugMode?: boolean
}) {
  const { onBoxSelect, moving, deleting, debugMode } = props
  const savesAndBanks = useSaves()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { homeData } = savesAndBanks

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!active || !over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    const activeIndex = homeData.boxes.findIndex((box) => box.id === activeId)
    const overIndex = homeData.boxes.findIndex((box) => box.id === overId)

    const newOrderIndices = calculateNewBoxOrder(activeIndex, overIndex, homeData.boxes.length)
    const newOrderIds = newOrderIndices
      .map((index) => homeData.boxes.find((box) => box.index === index)?.id)
      .filter(filterUndefined)

    savesAndBanks.reorderBoxesCurrentBank(newOrderIds)
  }

  return (
    <OpenHomeCtxMenu elements={getBankContextActions(savesAndBanks)}>
      <Grid columns="6" gap="1" overflowY="auto" maxHeight="80%">
        {moving ? (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={homeData.boxes.map((box) => box.id) ?? []}
              strategy={rectSortingStrategy}
            >
              {homeData.boxes.map((box, boxIndex) => (
                <DraggableBoxOverview
                  key={box.id}
                  box={box}
                  onBoxSelect={() => onBoxSelect(boxIndex)}
                  debugMode={debugMode}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          homeData.boxes.map((box, boxIndex) => (
            <ClickableBoxOverview
              key={box.id}
              box={box}
              onBoxSelect={() => onBoxSelect(boxIndex)}
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
  box: HomeBox
  onBoxSelect: () => void
  debugMode?: boolean
  deleting?: boolean
}

function ClickableBoxOverview({ box, onBoxSelect, debugMode, deleting }: BoxOverviewProps) {
  const savesAndBanks = useSaves()

  const firstOpenIndex = box.firstEmptyIndex()

  return (
    <DroppableSpace
      dropID={`box-${box.id}`}
      key={box.name ?? `Box ${box.index + 1}`}
      dropData={savesAndBanks.homeData.boxFirstEmptyLocation(box.index)}
      disabled={firstOpenIndex === undefined}
      style={{ justifyContent: undefined }}
    >
      <OpenHomeCtxMenu sections={getBoxContextActions(savesAndBanks, box)}>
        <div style={{ position: 'relative' }}>
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
                backgroundColor: box.containsMons() ? 'var(--gray-6)' : undefined,
              }}
              variant="solid"
              color="red"
              radius="full"
              disabled={box.containsMons()}
              onClick={() => savesAndBanks.deleteBoxCurrentBank(box.id, box.index)}
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
  const savesAndBanks = useSaves()

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: isDragging ? 1000 : undefined,
  }

  if (!box) return <div />

  return (
    <OpenHomeCtxMenu sections={getBoxContextActions(savesAndBanks, box)}>
      <Flex ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Button
          className="box-overview-button"
          variant="solid"
          style={{ cursor: active ? 'grabbing' : 'grab' }}
        >
          <BoxWithMons box={box} debugMode={debugMode} />
        </Button>
      </Flex>
    </OpenHomeCtxMenu>
  )
}

type BoxMonIconsProps = {
  box: HomeBox
  debugMode?: boolean
}

function BoxWithMons({ box, debugMode }: BoxMonIconsProps) {
  return (
    <Flex direction="column" width="100%">
      <div className="box-icon-mon-container">
        {range(HomeData.BOX_COLUMNS).map((i) => (
          <div className="box-icon-mon-col" key={`pos-display-col-${i}`}>
            {range(HomeData.BOX_ROWS).map((j) => (
              <div
                className={`box-icon-mon-indicator ${!box?.pokemon?.[j * HomeData.BOX_COLUMNS + i] ? 'box-icon-mon-empty' : ''}`}
                key={`pos-display-cell-${i}-${j}`}
              />
            ))}
          </div>
        ))}
      </div>
      {box.name ?? `Box ${box.index + 1}`}
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

function getBankContextActions(savesAndBanks: SavesAndBanksManager) {
  return [
    SubmenuBuilder.fromLabel('Sort all boxes...').withBuilders(
      SortTypes.map((sortType) =>
        ItemBuilder.fromLabel(`By ${sortType}`).withAction(() =>
          savesAndBanks.sortAllHomeBoxes(sortType)
        )
      )
    ),
    SubmenuBuilder.fromLabel('Add Box...').withBuilders([
      ItemBuilder.fromLabel('Beginning').withAction(() => savesAndBanks.addBoxCurrentBank('start')),
      ItemBuilder.fromLabel('End').withAction(() => savesAndBanks.addBoxCurrentBank('end')),
    ]),
  ]
}

function getBoxContextActions(
  savesAndBanks: SavesAndBanksManager,
  box: HomeBox
): CtxMenuElementBuilder[][] {
  const boxActions = [
    ItemBuilder.fromLabel('Remove duplicates from this box')
      .withAction(() => savesAndBanks.removeDupesFromHomeBox(box.index))
      .withDisabled(!box.containsMons()),
    SubmenuBuilder.fromLabel('Sort this box...')
      .withBuilders(
        SortTypes.map((sortType) =>
          ItemBuilder.fromLabel(`By ${sortType}`).withAction(() =>
            savesAndBanks.sortHomeBox(box.index, sortType)
          )
        )
      )
      .withDisabled(!box.containsMons()),
    SubmenuBuilder.fromLabel('Sort all boxes...').withBuilders(
      SortTypes.map((sortType) =>
        ItemBuilder.fromLabel(`By ${sortType}`).withAction(() =>
          savesAndBanks.sortAllHomeBoxes(sortType)
        )
      )
    ),
    ItemBuilder.fromLabel('Delete Box')
      .withAction(() => savesAndBanks.deleteBoxCurrentBank(box.id, box.index))
      .withDisabled(box.containsMons()),
  ]

  const addBoxActions = [
    SubmenuBuilder.fromLabel('Add Box...').withBuilders([
      ItemBuilder.fromLabel('Before').withAction(() =>
        savesAndBanks.addBoxCurrentBank(['before', box.index])
      ),
      ItemBuilder.fromLabel('After').withAction(() =>
        savesAndBanks.addBoxCurrentBank(['after', box.index])
      ),
      ItemBuilder.fromLabel('Beginning').withAction(() => savesAndBanks.addBoxCurrentBank('start')),
      ItemBuilder.fromLabel('End').withAction(() => savesAndBanks.addBoxCurrentBank('end')),
    ]),
  ]

  return [boxActions, addBoxActions]
}
