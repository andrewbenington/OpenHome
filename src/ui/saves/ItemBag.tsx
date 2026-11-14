import { stringSorter } from '@openhome-core/util/sort'
import { OpenHomeItemTransfer } from '@openhome-ui/items/types'
import { useItemBag } from '@openhome-ui/state/items'
import { Item } from '@pkm-rs/pkg'
import { Flex, Grid } from '@radix-ui/themes'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function ItemBag() {
  const { itemCounts } = useItemBag()

  return (
    <Flex direction="column" p="var(--padding-radius-sm-lg)">
      <DroppableSpace dropID="item-bag" className="item-bag-area">
        <Grid columns="6" gap="var(--padding-radius-sm-lg)">
          {Object.entries(itemCounts)
            .map(([indexStr, count]) => [parseInt(indexStr), count] as const)
            .map(([index, count]) => [index, Item.fromIndex(index), count] as const)
            .filter(
              ([index, item]) => item !== undefined && OpenHomeItemTransfer.maxAllowed(index) !== 1
            )
            .map(([index, item, count]) => ({ validatedIndex: item, count, index }))
            .sort(stringSorter(({ validatedIndex }) => validatedIndex?.name))
            .map(({ validatedIndex, count, index }) => (
              <Flex className="item-bag-slot" key={index} align="center" justify="center">
                {validatedIndex ? (
                  <DraggableItem item={validatedIndex} count={count} />
                ) : (
                  <img
                    src="/items/index/0000.png"
                    alt=""
                    aria-hidden
                    draggable={false}
                    style={{ opacity: 0 }}
                  />
                )}
              </Flex>
            ))}
        </Grid>
      </DroppableSpace>
    </Flex>
  )
}
