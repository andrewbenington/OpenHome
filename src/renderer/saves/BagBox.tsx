import { Card, Grid, IconButton, Stack, Typography } from '@mui/joy'
import { ItemFromString } from 'pokemon-resources'
import { PKMInterface } from '../../types/interfaces'
import { RemoveIcon } from '../components/Icons'
import { Bag } from './Bag'

interface BagBoxProps {
  onClose: () => void
  removeItemFromPokemon: (itemName: string) => void
  draggedMon: PKMInterface | null
  setDraggedItem: React.Dispatch<React.SetStateAction<string | null>>
  items: { name: string; count: number }[]
  updateBag: () => void
}

const BagBox = ({
  onClose,
  removeItemFromPokemon,
  draggedMon,
  setDraggedItem,
  updateBag,
}: BagBoxProps) => {
  let items = Bag.getItems()

  const totalSlots = Math.max(6 * 1, Math.ceil(items.length / 6) * 6)

  const getItemIconPath = (itemName: string) => {
    const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')
    return itemId ? `/items/index/${itemId}.png` : ''
  }

  const handleOpenBag = () => {
    console.log('Bag Contents:', items)
    onClose()
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
      <Card
        onClick={handleOpenBag}
        sx={{
          padding: 1,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 40,
          textAlign: 'center',
        }}
        variant="outlined"
      >
        <IconButton
          //   onClick={onClose}
          color="danger"
          size="sm"
          sx={{ position: 'absolute', left: 8 }}
        >
          <RemoveIcon />
        </IconButton>

        <Typography sx={{ fontWeight: 'bold' }}>Bag</Typography>
      </Card>

      {/* Grid for Displaying Items */}
      <Card sx={{ marginTop: 1, padding: 1 }}>
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
                  border: '3px solid #e0fcdc',
                  background: '#6662',
                  borderRadius: '5px',
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
      </Card>
    </Stack>
  )
}

export default BagBox
