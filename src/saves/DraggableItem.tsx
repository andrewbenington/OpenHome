import { useDraggable } from '@dnd-kit/react'
import { Text } from '@radix-ui/themes'
import { ItemFromString } from 'pokemon-resources'

function DraggableItem({ item }: { item: { name: string; count: number } }) {
  const { ref, isDragging } = useDraggable({
    id: `item-${item.name}`,
    data: { kind: 'item', itemName: item.name },
  })

  const getItemIconPath = (itemName: string) => {
    const itemId = ItemFromString(itemName)?.toString().padStart(4, '0')

    return itemId ? `/items/index/${itemId}.png` : ''
  }

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
        src={getItemIconPath(item.name)}
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

export default DraggableItem
