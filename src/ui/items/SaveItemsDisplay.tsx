import { Option } from '@openhome-core/util/functional'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import LabelledInput from '@openhome-ui/components/input/LabelledInput'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { Item, ItemDataTs } from '@pkm-rs/pkg'
import { Card, VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import { ItemRow } from './ItemRow'
import './SaveItemsDisplay.css'
import { TitledCard } from './TitledCard'

interface SaveItemsDisplayProps {
  items: ItemDataTs[]
}

export function SaveItemsDisplay(props: SaveItemsDisplayProps) {
  const { items } = props
  const parentRef = useRef(null)
  const [saveItemSelected, setSaveItemSelected] = useState<Option<number>>(undefined)

  const filteredItems = items.filter((item) => item.is_obtained)
  const saveSelected = saveItemSelected
    ? items.find((item) => item.index === saveItemSelected)
    : undefined

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <TitledCard title="Save File" side="left">
          <SaveItemsScroller
            items={filteredItems}
            selectedIndex={saveItemSelected}
            onClick={(index) => setSaveItemSelected(saveItemSelected === index ? undefined : index)}
          />
        </TitledCard>
        <TitledCard title="OpenHome Item Bag" side="right">
          <SaveItemsScroller
            items={filteredItems}
            selectedIndex={saveItemSelected}
            onClick={(index) => setSaveItemSelected(saveItemSelected === index ? undefined : index)}
          />
        </TitledCard>
      </OhoFlex.RowEqualSized>
      <div className="item-transfer-card" style={{ gridColumn: '1 / span 2' }}>
        <div>
          <h3>Save File</h3>
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--padding-radius-sm-lg)',
            }}
          >
            <OhoFlex.RowEnd>
              <p style={{ width: '200%' }}>
                {saveSelected?.index ? Item.fromIndex(saveSelected?.index)?.name : ''}
              </p>
              <p>×</p>
              <LabelledInput.Int
                key={saveSelected?.index}
                value={saveSelected?.count ?? 0}
                onChange={console.info}
              />
            </OhoFlex.RowEnd>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface SaveItemsScrollerProps {
  items: ItemDataTs[]
  selectedIndex?: number
  onClick?: (index: number) => void
}

function SaveItemsScroller(props: SaveItemsScrollerProps) {
  const { items } = props
  const parentRef = useRef(null)

  const virtualizer = useSimpleVirtualizer(
    items.length,
    (_, baseFontSize) => baseFontSize * 3,
    parentRef
  )

  return (
    <div ref={parentRef} className="item-scroller">
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index]
        return (
          <ItemRow
            key={item.index}
            itemData={item}
            selected={props.selectedIndex === item.index}
            onClick={() => props.onClick?.(item.index)}
          />
        )
      })}
    </div>
  )
}

export interface SaveItemsModalProps {
  items: ItemDataTs[]
  isOpen: boolean
  onClose?: () => void
}

export function SaveItemsModal(props: SaveItemsModalProps) {
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={(open) => !open && props.onClose?.()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="items-modal">
          <VisuallyHidden>
            <Dialog.Title>Pokémon Details</Dialog.Title>
            <Dialog.Description>Detailed information about the selected Pokémon</Dialog.Description>
          </VisuallyHidden>
          <Fallback>
            <SaveItemsDisplay items={props.items} />
          </Fallback>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
