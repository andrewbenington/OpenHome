import Badge from '@openhome-ui/components/badge/Badge'
import { Select } from '@openhome-ui/components/select/select'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { OpenhomeItemStorage, OriginGame } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'
import { VirtualItem } from '@tanstack/react-virtual'
import { CSSProperties, useRef } from 'react'
import { ItemRow } from './ItemRow'
import './ItemTransferSourceDisplay.css'
import { Side, TitledCard } from './TitledCard'
import { ItemData } from './types'
import { ItemSourceController } from './useItemSource'

interface ItemTransferSourceDisplayProps {
  sourceController: ItemSourceController
  destController: ItemSourceController
  active: boolean
  onSelect: () => void
  side: Side
}

export function ItemTransferSourceDisplay(props: ItemTransferSourceDisplayProps) {
  const { sourceController, destController, active, onSelect, side } = props
  const parentRef = useRef(null)

  return (
    <div ref={parentRef}>
      <TitledCard
        title={renderSource(sourceController.source.sourceType)}
        side={side}
        topControls={
          <Select.Root
            defaultValue="ALL_ITEMS"
            value={sourceController.pouch.toString()}
            onValueChange={(value) =>
              sourceController.setPouch(value === 'ALL_ITEMS' ? 'ALL_ITEMS' : parseInt(value))
            }
            onOpenChange={console.info}
          >
            <Select.Trigger />
            <Select.Content align="end">
              <Select.Item value="ALL_ITEMS">
                <Flex as="span" align="center" gap="0.5rem">
                  <img
                    className="item-category-icon"
                    src={getPublicImageURL(OpenhomeItemStorage.categoryIconPath('None'))}
                  />
                  All Items
                </Flex>
              </Select.Item>
              {sourceController.database.categoryIndexes().map((pouchIndex) => (
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
                          sourceController.database.internalCategoryToOpenhome(pouchIndex)
                        )
                      )}
                    />
                    {sourceController.database.categoryName(pouchIndex)}
                  </Flex>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        }
      >
        {sourceController.pouch !== 'ALL_ITEMS' &&
        sourceController.database.internalCategoryToOpenhome(sourceController.pouch) ===
          'KeyItems' ? (
          <KeyItemsScroller
            sourceController={sourceController}
            destController={destController}
            active={active}
            onClick={onSelect}
          />
        ) : (
          <SaveItemsScroller
            sourceController={sourceController}
            destController={destController}
            active={active}
            onClick={onSelect}
          />
        )}
      </TitledCard>
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

interface SaveItemsScrollerProps {
  sourceController: ItemSourceController
  destController: ItemSourceController
  active?: boolean
  onClick?: () => void
}

function SaveItemsScroller(props: SaveItemsScrollerProps) {
  const { sourceController, destController } = props
  const parentRef = useRef(null)

  const virtualizer = useSimpleVirtualizer(
    sourceController.items.length,
    (_, baseFontSize) => baseFontSize * 2,
    parentRef,
    { gap: 4 }
  )

  const isUnobtainable = (item: ItemData) =>
    sourceController.database.availability(item.index) !== 'Obtainable' ||
    destController.database.availability(item.index) !== 'Obtainable'

  function onClick(item: ItemData) {
    sourceController.setSelection(item.index)
    props.onClick?.()
  }

  return (
    <div ref={parentRef} className="item-scroller">
      <div className="item-scroller-inner" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((v) => {
          const item = sourceController.items[v.index]
          return (
            <ItemRow
              key={item.index}
              itemData={item}
              keyItem={false}
              database={sourceController.database}
              selected={sourceController.selection === item.index}
              inactive={props.active === false}
              soft={isUnobtainable(item)}
              disabled={destController.database.availability(item.index) !== 'Obtainable'}
              onClick={() => onClick(item)}
              style={style(v)}
            />
          )
        })}
      </div>
    </div>
  )
}

function KeyItemsScroller(props: SaveItemsScrollerProps) {
  const { sourceController, destController } = props
  const parentRef = useRef(null)

  const virtualizer = useSimpleVirtualizer(
    sourceController.items.length,
    (_, baseFontSize) => baseFontSize * 2,
    parentRef,
    { gap: 4 }
  )

  function onClick(item: ItemData) {
    sourceController.setSelection(item.index)
    props.onClick?.()
  }

  return (
    <div ref={parentRef} className="item-scroller">
      <div className="item-scroller-inner" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((v) => {
          const item = sourceController.items[v.index]
          return (
            <ItemRow
              key={item.index}
              itemData={item}
              keyItem
              database={sourceController.database}
              selected={sourceController.selection === item.index}
              inactive={props.active === false}
              soft={item.count === 0}
              disabled={destController.database.availability(item.index) !== 'Obtainable'}
              onClick={() => onClick(item)}
              style={style(v)}
            />
          )
        })}
      </div>
    </div>
  )
}

function style(virtualItem: VirtualItem): CSSProperties {
  return {
    width: '100%',
    height: `${virtualItem.size}px`,
    transform: `translateY(${virtualItem.start}px)`,
  }
}
