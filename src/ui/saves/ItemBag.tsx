import { useItems } from '@openhome-ui/state/items'
import { Item } from '@pkm-rs/pkg'
import { Flex, Grid } from '@radix-ui/themes'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function ItemBag() {
  const { itemCounts } = useItems()

  return (
    <Flex direction="column" p="1" gap="2" style={{ marginLeft: 5 }}>
      <DroppableSpace dropID="item-bag" className="item-bag-area">
        <Grid columns="6" gap="2" justify="end" align={'end'}>
          {Object.entries(itemCounts)
            .filter(([indexStr]) => parseInt(indexStr) > 0)
            .map(([indexStr, count]) => {
              const index = parseInt(indexStr)
              const validatedIndex = Item.fromIndex(index)
              return { validatedIndex, count, index }
            })
            .sort((a, b) => a.validatedIndex!.name.localeCompare(b.validatedIndex!.name))
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
