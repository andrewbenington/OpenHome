import { Card, Grid, Stack, Typography, IconButton } from '@mui/joy'
import { useMemo } from 'react'
import { RemoveIcon } from '../components/Icons'
import { ItemFromString } from 'pokemon-resources'
import { PKMFile } from '../../types/pkm/util'

interface BagBoxProps {
  items: { name: string }[]  
  onClose: () => void
  addItemToBag: (itemName: string) => void
  removeItemFromPokemon: (itemName: string) => void
  removeItemFromBag: (itemName: string) => void
  draggedMon: PKMFile | null
  setDraggedItem: React.Dispatch<React.SetStateAction<string | null>>
}

const BagBox = ({ items, onClose, addItemToBag, removeItemFromPokemon, removeItemFromBag, draggedMon, setDraggedItem}: BagBoxProps) => {
  const backgroundColor = useMemo(() => '#f5f5f5', [])

  const getItemIconPath = (itemName: string) => {
    const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')
    return itemId ? `/items/index/${itemId}.png` : ''
  }

  const handleOpenBag = () => {
    console.log("Bag Contents:", items)
    onClose()
  }

  const handlePokemonDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedMon?.heldItemIndex) {
      addItemToBag(draggedMon.heldItemName)
      removeItemFromPokemon(draggedMon.heldItemName)
      console.log(`Transferred "${draggedMon.heldItemIndex}" from Pokémon to the bag`)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemName: string) => {
    e.dataTransfer.setData('ItemTransfer', itemName)
    setDraggedItem(itemName);
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const itemName = e.dataTransfer.getData('ItemTransfer')
    if (itemName) {
      removeItemFromBag(itemName)
    }
  }

  return (
    <Stack style={{ width: '100%' }}>
      <Card
        onClick={handleOpenBag}
        sx={{
          backgroundColor,
          padding: 2,
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
          {items.map((item, index) => (
            <Grid
              xs={2}
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 1,
                border: '1px solid #ddd',
              }}
              onDrop={handlePokemonDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {getItemIconPath(item.name) ? (
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
              )}
            </Grid>
          ))}
        </Grid>
      </Card>
    </Stack>
  )
}

export default BagBox
