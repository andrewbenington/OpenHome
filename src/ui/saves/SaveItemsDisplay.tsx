import { Option } from '@openhome-core/util/functional'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import { FavoriteIcon } from '@openhome-ui/components/Icons'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { cssClass } from '@openhome-ui/util/style'
import { Item, ItemDataTs } from '@pkm-rs/pkg'
import { Card, Grid, Inset, Separator, VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import './SaveItemsDisplay.css'

interface SaveItemsDisplayProps {
  items: ItemDataTs[]
}

function SaveItemsDisplay(props: SaveItemsDisplayProps) {
  const { items } = props
  const parentRef = useRef(null)
  const [saveItemSelected, setSaveItemSelected] = useState<Option<number>>(undefined)

  const filteredItems = items.filter((item) => item.is_obtained)

  return (
    <div ref={parentRef} className="save-items-display">
      <div className="pokemon-modal-card titled-card">
        <OhoFlex.RowStart className="titled-card-header">
          <h3 className="titled-card-title">Save File</h3>
        </OhoFlex.RowStart>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <div className="titled-card-content scroller-wrapper">
          <SaveItemsScroller
            items={filteredItems}
            selectedIndex={saveItemSelected}
            onClick={(index) => setSaveItemSelected(saveItemSelected === index ? undefined : index)}
          />
        </div>
      </div>

      <SaveItemsScroller
        items={filteredItems}
        selectedIndex={saveItemSelected}
        onClick={(index) => setSaveItemSelected(saveItemSelected === index ? undefined : index)}
      />
      <Card>Save</Card>
      <Card>Save</Card>
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
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <ItemRow
          key={String(virtualRow.index)}
          itemData={items[virtualRow.index]}
          selected={props.selectedIndex === virtualRow.index}
          onClick={() => props.onClick?.(virtualRow.index)}
        />
      ))}
    </div>
  )
}

export interface ItemRowProps {
  itemData: ItemDataTs
  selected: boolean
  onClick?: () => void
}

function ItemRow({ itemData, selected, onClick }: ItemRowProps) {
  const item = Item.fromIndex(itemData.index)
  return (
    <Grid
      className={cssClass('item-row').with('item-row-selected').if(selected).build()}
      onClick={onClick}
    >
      {item ? (
        <img
          className="fill-parent"
          src={getPublicImageURL(getItemIconPath(item.index))}
          alt={item.name}
          title={item.name}
          draggable={false}
        />
      ) : (
        <img
          src="/items/index/0000.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{ opacity: 0 }}
        />
      )}
      <div>{item?.name}</div>
      {itemData.is_favorite ? <FavoriteIcon /> : <div />}
      <div className="item-count">x{itemData.count}</div>
    </Grid>
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
