import { useDroppable } from '@dnd-kit/core'
import { Grid, Stack, Typography, useTheme } from '@mui/joy'
import { ItemFromString } from 'pokemon-resources'
import { Bag } from './Bag'

// interface BagBoxProps {
// removeItemFromPokemon: (itemName: string) => void
// draggedMon: PKMInterface | null
// setDraggedItem: React.Dispatch<React.SetStateAction<string | null>>
// items: { name: string; count: number }[]
// updateBag: () => void
// }

const BagBox =
  (/*{ removeItemFromPokemon, draggedMon, setDraggedItem, updateBag }: BagBoxProps*/) => {
    const theme = useTheme()
    let items = Bag.getItems()

    const rowsNeeded = Math.ceil(items.length / 6) + (items.length % 6 === 0 ? 1 : 0)
    const totalSlots = rowsNeeded * 6

    const getItemIconPath = (itemName: string) => {
      const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')
      return itemId ? `/items/index/${itemId}.png` : ''
    }

    const { setNodeRef, isOver } = useDroppable({
      id: 'bag-box-grid',
    })

    const handlePokemonDrop = (e: React.DragEvent) => {
      e.preventDefault()
      const draggedData = JSON.parse(e.dataTransfer.getData('application/json'))

      console.log(draggedData)

      // if (draggedMon?.heldItemIndex) {
      //   Bag.addItem(draggedMon.heldItemName)
      //   removeItemFromPokemon(draggedMon.heldItemName)
      //   console.log(`Transferred "${draggedMon.heldItemIndex}" from Pokémon to the bag`)
      // }
    }

    const handleDragStart = (e: React.DragEvent, itemName: string) => {
      // e.dataTransfer.setData('ItemTransfer', itemName)
      // setDraggedItem(itemName)
    }

    const handleDragEnd = (e: React.DragEvent) => {
      // const itemName = e.dataTransfer.getData('ItemTransfer')
      // if (itemName) {
      //   Bag.popItem(itemName)
      //   updateBag()
      // }
      // items = Bag.getItems()
      // console.info(items)
    }

    return (
      // <DroppableSpace>
      <Stack style={{ width: '100%' }} ref={setNodeRef}>
        {/* Grid for Displaying Items */}
        <Grid container spacing={1} component="div">
          {Array.from({ length: totalSlots }, (_, index) => {
            const item = items[index]
            return (
              <Grid
                xs={2}
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 1,
                  aspectRatio: 1,
                  background: theme.palette.background.surface,
                }}
                onDrop={(e) => {
                  console.log(e)
                  handlePokemonDrop(e)
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {item ? (
                  <div style={{ position: 'relative', width: 24, height: 24 }}>
                    {getItemIconPath(item.name) ? (
                      <img
                        src={getItemIconPath(item.name)}
                        alt={item.name}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.name)}
                        onDragEnd={handleDragEnd}
                        style={{ width: '100%', height: '100%' }}
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 12 }}>{item.name}</Typography>
                    )}
                    {/* Item Count */}
                    <Typography // NOTE THIS WILL NEED TO BE ADJUSTED
                      sx={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'absolute',
                        bottom: -6,
                        right: -6,
                      }}
                    >
                      {item.count}
                    </Typography>
                  </div>
                ) : null}
              </Grid>
            )
          })}
        </Grid>
      </Stack>
      // </DroppableSpace>
    )
  }

export default BagBox
