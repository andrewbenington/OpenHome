import { useDraggable } from '@dnd-kit/react'
import { ItemIndex } from '@pkm-rs-resources/pkg'
import { Text } from '@radix-ui/themes'
import { getPublicImageURL } from '../images/images'
import { getItemIconPath } from '../images/items'

type DraggableItemProps = {
  item: ItemIndex
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
      <img
        src={getPublicImageURL(getItemIconPath(item.index, 'PK9'))}
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
        {count}
      </Text>
    </div>
  )
}

export default DraggableItem
