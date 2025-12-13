import { useDraggable } from '@dnd-kit/react'
import { Item } from '@pkm-rs/pkg'
import { Text, Tooltip } from '@radix-ui/themes'
import { getPublicImageURL } from 'src/ui/images/images'
import { getItemIconPath } from 'src/ui/images/items'

type DraggableItemProps = {
  item: Item
  count: number
}

function DraggableItem({ item, count }: DraggableItemProps) {
  const { ref, isDragging } = useDraggable({
    id: `item-${item.name}`,
    data: { kind: 'item', item: item },
  })

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
      <Tooltip content={item.name}>
        <img
          src={getPublicImageURL(getItemIconPath(item.index))}
          alt={item.name}
          style={{
            width: '100%',
            height: '100%',
            visibility: isDragging ? 'hidden' : undefined,
          }}
          draggable={false}
        />
      </Tooltip>

      <Text
        size="1"
        weight="bold"
        style={{
          position: 'absolute',
          bottom: -6,
          right: -6,
        }}
      >
        {count}
      </Text>
    </div>
  )
}

export default DraggableItem
