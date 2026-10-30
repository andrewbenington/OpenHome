import { Option } from '@openhome-core/util/functional'
import { multiSorter, numericSorter, stringSorter } from '@openhome-core/util/sort'
import Badge from '@openhome-ui/components/badge/Badge'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import { ArrowUpIcon } from '@openhome-ui/components/Icons'
import LabelledInput from '@openhome-ui/components/input/LabelledInput'
import OhoButton from '@openhome-ui/components/OhoButton'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { Item, OpenhomeItemStorage, OriginGame } from '@pkm-rs/pkg'
import { Card, Flex, Select, VisuallyHidden } from '@radix-ui/themes'
import { useMemo, useRef, useState } from 'react'
import { ItemIcon } from './ItemIcon'
import { ItemRow } from './ItemRow'
import './ItemTransfer.css'
import { TitledCard } from './TitledCard'
import { ItemTransferSource } from './transfer'

interface ItemTransferProps {
  source1: ItemTransferSource
  source2: ItemTransferSource
}

type Source = 'source1' | 'source2'
type ItemSort = 'category_and_index' | 'alphabetical'

type ItemFilter = {
  includeUnsupported: boolean
  includeEmpty: boolean
  includeBlank: boolean
  sort: ItemSort
}

const defaultFilter: ItemFilter = {
  includeEmpty: false,
  includeUnsupported: false,
  includeBlank: false,
  sort: 'category_and_index',
}

function useSourceController(
  source: ItemTransferSource,
  dest: ItemTransferSource,
  itemFilter: ItemFilterController
) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const [pouch, setPouch] = useState<number | 'ALL_ITEMS'>('ALL_ITEMS')

  const { filter } = itemFilter
  const allItems = useMemo(() => source.getItemData(), [source])

  const database = source.database

  const items = useMemo(
    () =>
      allItems
        .filter(
          (item) =>
            filter.includeUnsupported || dest.database.availability(item.index) !== 'Unsupported'
        )
        .filter((item) => pouch === 'ALL_ITEMS' || item.pouch === pouch)
        .filter((item) => {
          const nameTrimmed = Item.fromIndex(item.index)?.name?.trim()
          return (nameTrimmed && nameTrimmed !== '???') || filter.includeBlank
        })
        .filter((item) => item.count > 0 || filter?.includeEmpty)
        .toSorted(
          filter.sort === 'alphabetical'
            ? stringSorter((item) => Item.fromIndex(item.index)?.name)
            : multiSorter(
                numericSorter((item) => item.index),
                numericSorter((item) => item.pouch)
              )
        ),
    [allItems, pouch, dest, filter]
  )

  const item = selection ? items.find((item) => item.index === selection) : undefined

  return {
    item,
    items,
    selection,
    setSelection,
    source,
    database,
    pouch,
    setPouch,
    ...itemFilter,
  }
}

function useItemFilter() {
  const [filter, setFilter] = useState<ItemFilter>(defaultFilter)

  function updateFilter(updates: Partial<ItemFilter>) {
    setFilter({ ...filter, ...updates })
  }

  return { filter, updateFilter }
}

type ItemFilterController = ReturnType<typeof useItemFilter>

export function ItemTransfer(props: ItemTransferProps) {
  const { source1, source2 } = props
  const parentRef = useRef(null)
  const itemFilter = useItemFilter()
  const [selectedSourceId, setSelectedSourceId] = useState<Option<Source>>()

  const source1Controller = useSourceController(source1, source2, itemFilter)
  const source2Controller = useSourceController(source2, source1, itemFilter)

  const selectedSourceController =
    selectedSourceId === 'source1' ? source1Controller : source2Controller

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <TitledCard
          title={renderSource(source1.sourceType)}
          topControls={
            <Select.Root
              size="1"
              defaultValue="ALL_ITEMS"
              value={source1Controller.pouch.toString()}
              onValueChange={(value) =>
                source1Controller.setPouch(value === 'ALL_ITEMS' ? 'ALL_ITEMS' : parseInt(value))
              }
              onOpenChange={console.info}
            >
              <Select.Trigger />
              <Select.Content
                position="popper"
                align="end"
                container={document.getElementsByClassName('items-modal').item(0)}
              >
                <Select.Item value="ALL_ITEMS">
                  <Flex as="span" align="center" gap="0.5rem">
                    <img
                      className="item-category-icon"
                      src={getPublicImageURL(OpenhomeItemStorage.categoryIconPath('None'))}
                    />
                    All Items
                  </Flex>
                </Select.Item>
                {source1Controller.database.categoryIndexes().map((pouchIndex) => (
                  <Select.Item
                    className="item-category-select"
                    key={pouchIndex}
                    value={pouchIndex.toString()}
                  >
                    <Flex as="span" align="center" gap="0.5rem">
                      <img
                        className="item-category-icon"
                        src={getPublicImageURL(
                          OpenhomeItemStorage.categoryIconPath(
                            source1Controller.database.catIndexToOpenHome(pouchIndex)
                          )
                        )}
                      />
                      {source1Controller.database.categoryName(pouchIndex)}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          }
          side="left"
        >
          <SaveItemsScroller
            sourceController={source1Controller}
            active={selectedSourceId === 'source1'}
            onClick={() => {
              setSelectedSourceId('source1')
              document.getElementById(AMOUNT_INPUT_ID)?.focus()
            }}
          />
        </TitledCard>
        <TitledCard
          title={renderSource(source2.sourceType)}
          side="right"
          topControls={
            <Select.Root
              size="1"
              defaultValue="ALL_ITEMS"
              value={source2Controller.pouch.toString()}
              onValueChange={(value) =>
                source2Controller.setPouch(value === 'ALL_ITEMS' ? 'ALL_ITEMS' : parseInt(value))
              }
            >
              <Select.Trigger />
              <Select.Content position="popper" align="start">
                <Select.Item value="ALL_ITEMS">
                  <Flex as="span" align="center" gap="0.5rem">
                    <img
                      className="item-category-icon"
                      src={getPublicImageURL(OpenhomeItemStorage.categoryIconPath('None'))}
                    />
                    All Items
                  </Flex>
                </Select.Item>
                {source2Controller.database.categoryIndexes().map((pouchIndex) => (
                  <Select.Item key={pouchIndex} value={pouchIndex.toString()}>
                    <Flex as="span" align="center" gap="0.5rem">
                      <img
                        className="item-category-icon"
                        src={getPublicImageURL(
                          OpenhomeItemStorage.categoryIconPath(
                            source2Controller.database.catIndexToOpenHome(pouchIndex)
                          )
                        )}
                      />
                      {source2Controller.database.categoryName(pouchIndex)}
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          }
        >
          <SaveItemsScroller
            sourceController={source2Controller}
            active={selectedSourceId === 'source2'}
            onClick={() => {
              setSelectedSourceId('source2')
              document.getElementById(AMOUNT_INPUT_ID)?.focus()
            }}
          />
        </TitledCard>
      </OhoFlex.RowEqualSized>
      <div className="item-transfer-card">
        <OhoFlex.ColFullWidth>
          <ItemTransferControls
            sourceController={selectedSourceController}
            destController={
              selectedSourceController === source1Controller ? source2Controller : source1Controller
            }
            side={selectedSourceId === 'source1' ? 'right' : 'left'}
          />
          <Card style={{ padding: 'var(--padding-radius-sm-lg)', flex: 1 }}>
            <OhoFlex.Row gap="6">
              <LabelledInput.Checkbox
                label="Show Unsupported"
                checked={selectedSourceController.filter.includeUnsupported}
                onCheckedChange={(includeUnsupported) =>
                  selectedSourceController.updateFilter({ includeUnsupported })
                }
              />
              <LabelledInput.Checkbox
                label="Show Empty Slots"
                checked={selectedSourceController.filter.includeEmpty}
                onCheckedChange={(includeEmpty) =>
                  selectedSourceController.updateFilter({ includeEmpty })
                }
              />
              <LabelledInput.Checkbox
                label="Show Blank/???"
                checked={selectedSourceController.filter.includeBlank}
                onCheckedChange={(includeBlank) =>
                  selectedSourceController.updateFilter({ includeBlank })
                }
              />
            </OhoFlex.Row>
          </Card>
        </OhoFlex.ColFullWidth>
      </div>
    </div>
  )
}

function renderSource(source: OriginGame | 'OpenHome') {
  return source === 'OpenHome' ? (
    <Badge.OpenHome />
  ) : (
    <Badge.Game originGame={source} withName style={{ width: 'fit-content' }} />
  )
}

type ItemTransferControlsProps = {
  sourceController: Option<SourceController>
  destController: Option<SourceController>
  side: 'left' | 'right'
}

const AMOUNT_INPUT_ID = 'item-transfer-amount-input'

function ItemTransferControls(props: ItemTransferControlsProps) {
  const [itemCount, setItemCount] = useState<number | ''>(
    props.sourceController?.item?.count ? 1 : 0
  )
  const sourceItem = props.sourceController?.item
    ? Item.fromIndex(props.sourceController?.item.index)
    : undefined

  const button = (
    <OhoButton
      size="2"
      color="red"
      variant="classic"
      style={{ fontWeight: 'bold', height: '2.5rem', width: '12rem' }}
      onClick={() => {
        if (itemCount && sourceItem?.index) {
          props.sourceController?.source.removeItems(sourceItem?.index, itemCount)
          props.destController?.source.addItems(sourceItem?.index, itemCount)
        }
      }}
      disabled={!itemCount}
    >
      {props.side === 'left' && <ArrowUpIcon />}
      Send Items
      {props.side === 'right' && <ArrowUpIcon />}
    </OhoButton>
  )

  const maxAllowed = sourceItem?.index
    ? props.destController?.database.maxAllowed(sourceItem.index)
    : undefined
  const max =
    maxAllowed && props.sourceController?.item?.count
      ? Math.min(maxAllowed, props.sourceController.item.count)
      : undefined

  return (
    <OhoFlex.Row width="100%">
      {props.side === 'left' && button}
      <Card style={{ padding: 'var(--padding-radius-sm-lg)', flex: 1 }}>
        <OhoFlex.Row
          justify={props.side === 'left' ? 'end' : 'start'}
          align="center"
          gap="3"
          width="100%"
        >
          <ItemIcon item={sourceItem} style={{ width: '1.15rem', height: '1.15rem' }} />
          {sourceItem?.name ? (
            <p>{sourceItem.name}</p>
          ) : (
            <p className="select-item-message">Select Item</p>
          )}
          <p>×</p>
          <LabelledInput.Int
            id={AMOUNT_INPUT_ID}
            key={sourceItem?.index}
            value={itemCount || 0}
            min={0}
            max={max}
            onChange={(v) => setItemCount(v ?? 0)}
            style={{ width: '3.25rem' }}
            disabled={!sourceItem}
            autoFocus
          />
          <code>/</code>
          <code style={{ width: '3rem' }}>{props.sourceController?.item?.count ?? '--'}</code>
        </OhoFlex.Row>
      </Card>
      {props.side === 'right' && button}
    </OhoFlex.Row>
  )
}

type SourceController = ReturnType<typeof useSourceController>

interface SaveItemsScrollerProps {
  sourceController: SourceController
  active?: boolean
  onClick?: () => void
}

function SaveItemsScroller(props: SaveItemsScrollerProps) {
  const { sourceController } = props
  const parentRef = useRef(null)

  const virtualizer = useSimpleVirtualizer(
    sourceController.items.length,
    (_, baseFontSize) => baseFontSize * 2,
    parentRef,
    { gap: 4 }
  )

  return (
    <div ref={parentRef} className="item-scroller">
      <div className="item-scroller-inner" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((v) => {
          const item = sourceController.items[v.index]
          return (
            <ItemRow
              key={item.index}
              itemData={item}
              database={sourceController.database}
              selected={sourceController.selection === item.index}
              inactive={props.active === false}
              onClick={() => {
                sourceController.setSelection(item.index)
                props.onClick?.()
              }}
              style={{
                width: '100%',
                height: `${v.size}px`,
                transform: `translateY(${v.start}px)`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export interface SaveItemsModalProps {
  source1: ItemTransferSource
  source2: ItemTransferSource
  isOpen: boolean
  onClose?: () => void
}

export function SaveItemsModal(props: SaveItemsModalProps) {
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={(open) => !open && props.onClose?.()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="items-modal">
          <VisuallyHidden>
            <Dialog.Title>Pokémon Details</Dialog.Title>
            <Dialog.Description>Detailed information about the selected Pokémon</Dialog.Description>
          </VisuallyHidden>
          <Fallback>
            <ItemTransfer source1={props.source1} source2={props.source2} />
          </Fallback>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
