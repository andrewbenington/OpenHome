import { useItems } from '@openhome-ui/state/items'
import { Item } from '@pkm-rs/pkg'
import { Flex, Grid } from '@radix-ui/themes'
import { useCallback, useEffect } from 'react'
import useDragAndDrop from '../state/drag-and-drop/useDragAndDrop'
import DroppableSpace from './boxes/DroppableSpace'
import DraggableItem from './DraggableItem'

export default function ItemBag() {
  const { itemCounts } = useItems()
  const { setMode } = useDragAndDrop()

  const onOver = useCallback(() => setMode('item'), [setMode])
  const onNotOver = useCallback(() => setMode('mon'), [setMode])

  useEffect(() => {
    console.log('setMode changed')
  }, [setMode])

  return (
    <Flex direction="column" p="1" gap="2" style={{ marginLeft: 5 }}>
      <DroppableSpace
        dropID="item-bag"
        style={{
          borderRadius: 6,
          boxSizing: 'content-box',
          justifyContent: 'start',
          alignItems: 'start',
          height: '100%',
          padding: '5px 0px',
        }}
        // onOver={onOver}
        // onNotOver={onNotOver}
      >
        <Grid columns="6" gap="2" justify="end" align={'end'}>
          {Object.entries(itemCounts).map(([indexStr, count]) => {
            const index = parseInt(indexStr)
            const validatedIndex = Item.fromIndex(index)

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
