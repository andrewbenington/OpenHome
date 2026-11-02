import { Option } from '@openhome-core/util/functional'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import { ArrowUpIcon } from '@openhome-ui/components/Icons'
import LabelledInput from '@openhome-ui/components/input/LabelledInput'
import OhoButton from '@openhome-ui/components/OhoButton'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import { Item } from '@pkm-rs/pkg'
import { VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import { ItemIcon } from './ItemIcon'
import './ItemTransfer.css'
import { ItemTransferSourceDisplay } from './ItemTransferSourceDisplay'
import { ItemTransferSource } from './types'
import { useItemFilter } from './useItemFilter'
import { ItemSourceController, useItemSource } from './useItemSource'

type Source = 'source1' | 'source2'

export interface ItemTransferProps {
  source1: ItemTransferSource
  source2: ItemTransferSource
}

export function ItemTransfer(props: ItemTransferProps) {
  const { source1, source2 } = props
  const parentRef = useRef(null)
  const itemFilter = useItemFilter()
  const [selectedSourceId, setSelectedSourceId] = useState<Option<Source>>()

  const source1Controller = useItemSource(source1, source2, itemFilter)
  const source2Controller = useItemSource(source2, source1, itemFilter)

  const selectedSourceController =
    selectedSourceId === 'source1' ? source1Controller : source2Controller

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <ItemTransferSourceDisplay
          sourceController={source1Controller}
          destController={source2Controller}
          active={selectedSourceId === 'source1'}
          onSelect={() => {
            setSelectedSourceId('source1')
            document.getElementById(AMOUNT_INPUT_ID)?.focus()
          }}
        />
        <ItemTransferSourceDisplay
          sourceController={source2Controller}
          destController={source1Controller}
          active={selectedSourceId === 'source2'}
          onSelect={() => {
            setSelectedSourceId('source2')
            document.getElementById(AMOUNT_INPUT_ID)?.focus()
          }}
        />
      </OhoFlex.RowEqualSized>
      <div className="item-transfer-card">
        <OhoFlex.ColFullWidth gap="1">
          <ItemTransferControls
            sourceController={selectedSourceController}
            destController={
              selectedSourceController === source1Controller ? source2Controller : source1Controller
            }
            side={selectedSourceId === 'source1' ? 'right' : 'left'}
          />
          <div className="card-sm-radius" style={{ flex: 1 }}>
            <OhoFlex.Row gap="6">
              <LabelledInput.Checkbox
                label="Show Unsupported"
                checked={selectedSourceController.filter.includeUnsupported}
                onCheckedChange={(includeUnsupported) =>
                  selectedSourceController.updateFilter({ includeUnsupported })
                }
              />
              <LabelledInput.Checkbox
                label="Show Empty Slots"
                checked={selectedSourceController.filter.includeEmpty}
                onCheckedChange={(includeEmpty) =>
                  selectedSourceController.updateFilter({ includeEmpty })
                }
              />
              <LabelledInput.Checkbox
                label="Show Blank/???"
                checked={selectedSourceController.filter.includeBlank}
                onCheckedChange={(includeBlank) =>
                  selectedSourceController.updateFilter({ includeBlank })
                }
              />
            </OhoFlex.Row>
          </div>
        </OhoFlex.ColFullWidth>
      </div>
    </div>
  )
}

type ItemTransferControlsProps = {
  sourceController: Option<ItemSourceController>
  destController: Option<ItemSourceController>
  side: 'left' | 'right'
}

const AMOUNT_INPUT_ID = 'item-transfer-amount-input'

function ItemTransferControls(props: ItemTransferControlsProps) {
  const [itemCount, setItemCount] = useState<number | ''>(
    props.sourceController?.item?.count ? 1 : 0
  )
  const sourceItem = props.sourceController?.item
    ? Item.fromIndex(props.sourceController?.item.index)
    : undefined

  const button = (
    <OhoButton
      size="2"
      color="red"
      variant="classic"
      style={{ fontWeight: 'bold', height: '2.5rem', width: '12rem' }}
      onClick={() => {
        if (itemCount && sourceItem?.index) {
          props.sourceController?.source.removeItems(sourceItem?.index, itemCount)
          props.destController?.source.addItems(sourceItem?.index, itemCount)
        }
      }}
      disabled={!itemCount}
    >
      {props.side === 'left' && <ArrowUpIcon />}
      Send Items
      {props.side === 'right' && <ArrowUpIcon />}
    </OhoButton>
  )

  const maxAllowed = sourceItem?.index
    ? props.destController?.database.maxAllowed(sourceItem.index)
    : undefined
  const max =
    maxAllowed && props.sourceController?.item?.count
      ? Math.min(maxAllowed, props.sourceController.item.count)
      : undefined

  return (
    <OhoFlex.Row width="100%" gap="1">
      {props.side === 'left' && button}
      <div className="card-sm-radius" style={{ flex: 1 }}>
        <OhoFlex.Row
          justify={props.side === 'left' ? 'end' : 'start'}
          align="center"
          gap="3"
          width="100%"
        >
          <ItemIcon item={sourceItem} style={{ width: '1.15rem', height: '1.15rem' }} />
          {sourceItem?.name ? (
            <p>{sourceItem.name}</p>
          ) : (
            <p className="select-item-message">Select Item</p>
          )}
          <p>×</p>
          <LabelledInput.Int
            id={AMOUNT_INPUT_ID}
            key={sourceItem?.index}
            value={itemCount || 0}
            min={0}
            max={max}
            onChange={(v) => setItemCount(v ?? 0)}
            style={{ width: '3.25rem' }}
            disabled={!sourceItem}
            autoFocus
          />
          <code>/</code>
          <code style={{ width: '3rem' }}>{props.sourceController?.item?.count ?? '--'}</code>
        </OhoFlex.Row>
      </div>
      {props.side === 'right' && button}
    </OhoFlex.Row>
  )
}

export interface SaveItemsModalProps {
  source1: ItemTransferSource
  source2: ItemTransferSource
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
            <ItemTransfer source1={props.source1} source2={props.source2} />
          </Fallback>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
