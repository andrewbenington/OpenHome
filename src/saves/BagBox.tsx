import { ItemIndex } from '@pkm-rs-resources/pkg'
import { Flex, Grid } from '@radix-ui/themes'
import { useContext } from 'react'
import { BagContext } from 'src/state/bag'
import { DragMonContext } from '../state/dragMon'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function BagBox() {
  const [bagState] = useContext(BagContext)
  const [, dragMonDispatch] = useContext(DragMonContext)

  return (
    <Flex
      direction="column"
      gap="2"
      style={{ width: 'calc(100% - 10px)', height: 'calc(100% - 10px)', margin: 5 }}
    >
      <DroppableSpace
        dropID="bag-box"
        style={{
          width: 'calc(100% - 10px)',
          height: 'calc(100% - 44px)',
          padding: 5,
          borderRadius: 6,
          boxSizing: 'content-box',
          justifyContent: 'start',
          alignItems: 'start',
        }}
        onOver={() => dragMonDispatch({ type: 'set_mode', payload: 'item' })}
        onNotOver={() => dragMonDispatch({ type: 'set_mode', payload: 'mon' })}
      >
        <Grid columns="6" gap="2" justify="end" align={'end'}>
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
  )
}
