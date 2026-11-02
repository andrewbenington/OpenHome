import Badge from '@openhome-ui/components/badge/Badge'
import { Select } from '@openhome-ui/components/select/select'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { OpenhomeItemStorage, OriginGame } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'
import { useRef } from 'react'
import { ItemRow } from './ItemRow'
import './ItemTransferSourceDisplay.css'
import { TitledCard } from './TitledCard'
import { ItemSourceController } from './useItemSource'

interface ItemTransferSourceDisplayProps {
  sourceController: ItemSourceController
  destController: ItemSourceController
  active: boolean
  onSelect: () => void
}

export function ItemTransferSourceDisplay(props: ItemTransferSourceDisplayProps) {
  const { sourceController, destController, active, onSelect } = props
  const parentRef = useRef(null)

  return (
    <div ref={parentRef}>
      <TitledCard
        title={renderSource(sourceController.source.sourceType)}
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
        side="left"
      >
        <SaveItemsScroller
          sourceController={sourceController}
          destController={destController}
          active={active}
          onClick={onSelect}
        />
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
              unobtainable={
                sourceController.database.availability(item.index) !== 'Obtainable' ||
                destController.database.availability(item.index) !== 'Obtainable'
              }
              disabled={destController.database.availability(item.index) !== 'Obtainable'}
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
