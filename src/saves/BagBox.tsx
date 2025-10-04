import { Card, Flex, Grid } from '@radix-ui/themes'
import { Bag } from './Bag'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function BagBox() {
  const items = Bag.getItems()
  const rowsNeeded = Math.ceil(items.length / 6) + (items.length % 6 === 0 ? 1 : 0)
  const totalSlots = rowsNeeded * 6

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
