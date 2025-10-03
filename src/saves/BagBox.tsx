import { useDraggable } from '@dnd-kit/react'
import { Card, Flex, Grid, Text } from '@radix-ui/themes'
import { ItemFromString } from 'pokemon-resources'
import { Bag } from './Bag'
import DroppableSpace from './boxes/DroppableSpace'

function DraggableItem({ item }: { item: { name: string; count: number } }) {
  const { ref, isDragging } = useDraggable({
    id: `item-${item.name}`,
    data: { kind: 'item', itemName: item.name },
  })

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: 24,
        height: 24,
        cursor: 'grab',
      }}
    >
      <img
        src={`/items/index/${ItemFromString(item.name)?.toString().padStart(4, '0')}.png`}
        alt={item.name}
        style={{
          width: '100%',
          height: '100%',
          visibility: isDragging ? 'hidden' : undefined,
        }}
        draggable={false}
      />
      <Text
        size="1"
        weight="bold"
        style={{
          position: 'absolute',
          bottom: -6,
          right: -6,
        }}
      >
        {item.count}
      </Text>
    </div>
  )
}

export default function BagBox() {
  const items = Bag.getItems()
  const rowsNeeded = Math.ceil(items.length / 6) + (items.length % 6 === 0 ? 1 : 0)
  const totalSlots = rowsNeeded * 6

  const getItemIconPath = (itemName: string) => {
    const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')

    return itemId ? `/items/index/${itemId}.png` : ''
  }

  return (
    <DroppableSpace
      dropID="bag-box"
      className="bag-box"
      style={{
        width: '100%',
        padding: 8,
      }}
    >
      <Card variant="surface" style={{ width: '100%' }}>
        <Grid columns="6" gap="2">
          {Array.from({ length: totalSlots }, (_, index) => {
            const item = items[index]

            return (
              <Flex
                key={index}
                align="center"
                justify="center"
                style={{
                  padding: 6,
                  aspectRatio: '1',
                  backgroundColor: 'var(--gray-2)',
                  borderRadius: 4,
                }}
              >
                {item ? <DraggableItem item={item} /> : null}
              </Flex>
            )
          })}
        </Grid>
      </Card>
    </DroppableSpace>
  )
}
