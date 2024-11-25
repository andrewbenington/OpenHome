import { Grid, Stack, Typography, useTheme } from '@mui/joy'
import { ItemFromString } from 'pokemon-resources'
import { PKMInterface } from '../../types/interfaces'
import { Bag } from './Bag'

interface BagBoxProps {
  removeItemFromPokemon: (itemName: string) => void
  draggedMon: PKMInterface | null
  setDraggedItem: React.Dispatch<React.SetStateAction<string | null>>
  items: { name: string; count: number }[]
  updateBag: () => void
}

const BagBox = ({ removeItemFromPokemon, draggedMon, setDraggedItem, updateBag }: BagBoxProps) => {
  const theme = useTheme()
  let items = Bag.getItems()

  const rowsNeeded = Math.ceil(items.length / 6) + (items.length % 6 === 0 ? 1 : 0)
  const totalSlots = rowsNeeded * 6
  
  const getItemIconPath = (itemName: string) => {
    const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')
    return itemId ? `/items/index/${itemId}.png` : ''
  }

  const handlePokemonDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedMon?.heldItemIndex) {
      Bag.addItem(draggedMon.heldItemName)
      removeItemFromPokemon(draggedMon.heldItemName)
      console.log(`Transferred "${draggedMon.heldItemIndex}" from Pokémon to the bag`)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemName: string) => {
    e.dataTransfer.setData('ItemTransfer', itemName)
    setDraggedItem(itemName)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const itemName = e.dataTransfer.getData('ItemTransfer')
    if (itemName) {
      Bag.popItem(itemName)
      updateBag()
    }
    items = Bag.getItems()
    console.info(items)
  }

  return (
    <Stack style={{ width: '100%' }}>
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
              onDrop={handlePokemonDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {item ? (
                getItemIconPath(item.name) ? (
                  <img
                    src={getItemIconPath(item.name)}
                    alt={item.name}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.name)}
                    onDragEnd={handleDragEnd}
                    style={{ width: 24, height: 24 }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <Typography sx={{ fontSize: 12 }}>{item.name}</Typography>
                )
              ) : null}
            </Grid>
          )
        })}
      </Grid>
    </Stack>
  )
}

export default BagBox
