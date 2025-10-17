import { Card, Flex, Grid } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
import { BagContext } from 'src/state/bag'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function BagBox() {
  const [bagState] = useContext(BagContext)
  const items = useMemo(() => Object.entries(bagState.items), [bagState.items])

  const rowsNeeded = Math.max(Math.ceil(items.length / 6) + (items.length % 6 === 0 ? 1 : 0), 6)
  const totalSlots = rowsNeeded * 6

  return (
    <Card style={{ contain: 'none', padding: 4, width: '100%', boxSizing: 'border-box' }}>
      <Flex direction="column" gap="2" style={{ width: '100%' }}>
        <DroppableSpace
          dropID="bag-box"
          className="bag-box"
          style={{
            width: '100%',
            padding: 8,
            borderRadius: 6,
            boxSizing: 'border-box',
          }}
        >
          <Grid columns="6" gap="2">
            {Array.from({ length: totalSlots }, (_, index) => {
              const entry = items[index]
              const name = entry?.[0]
              const count = entry?.[1]

              return (
                <Flex
                  key={index}
                  align="center"
                  justify="center"
                  style={{
                    padding: 6,
                    aspectRatio: '1',
                    backgroundColor: '#6662',
                    borderRadius: 4,
                  }}
                >
                  {entry ? <DraggableItem item={{ name, count }} /> : null}
                </Flex>
              )
            })}
          </Grid>
        </DroppableSpace>
      </Flex>
    </Card>
  )
}
