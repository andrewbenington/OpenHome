import { useDraggable } from '@dnd-kit/core'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { Item } from '@pkm-rs/pkg'
import { Text, Tooltip } from '@radix-ui/themes'
import { useState } from 'react'
import { classNames, hiddenIf } from '../util/style'

type DraggableItemProps = {
  item: Item
  count: number
}

function DraggableItem({ item, count }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging, active } = useDraggable({
    id: `item-${item.index}`,
    data: { kind: 'item', item: item },
  })
  const [imageError, setImageError] = useState(false)

  const image = !imageError ? (
    <img
      className={classNames('fill-parent', hiddenIf(isDragging))}
      src={getPublicImageURL(getItemIconPath(item.index))}
      alt={item.name}
      title={item.name}
      draggable={false}
      onError={() => setImageError(true)}
    />
  ) : (
    <img
      className={classNames('fill-parent', hiddenIf(isDragging))}
      src={getPublicImageURL('items/index/0000.png')}
      alt={item.name}
      draggable={false}
    />
  )

  return (
    <div className="draggable-item" ref={setNodeRef} {...listeners} {...attributes}>
      {/* tooltip causes performance issues when dragging; only show when not */}
      {active ? image : <Tooltip content={item.name}>{image}</Tooltip>}
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
