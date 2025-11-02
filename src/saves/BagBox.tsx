import { ItemIndex } from '@pkm-rs-resources/pkg'
import { Card, Flex, Grid } from '@radix-ui/themes'
import { useContext } from 'react'
import { BagContext } from 'src/state/bag'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function BagBox() {
  const [bagState] = useContext(BagContext)

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
            {Object.entries(bagState.itemCounts).map(([indexStr, count]) => {
              const index = parseInt(indexStr)
              const validatedIndex = ItemIndex.fromIndex(index)

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
              )
            })}
          </Grid>
        </DroppableSpace>
      </Flex>
    </Card>
  )
}
