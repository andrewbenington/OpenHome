import { Option } from '@openhome-core/util/functional'
import Badge from '@openhome-ui/components/badge/Badge'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import { ArrowUpIcon } from '@openhome-ui/components/Icons'
import LabelledInput from '@openhome-ui/components/input/LabelledInput'
import OhoButton from '@openhome-ui/components/OhoButton'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { Item, OriginGame } from '@pkm-rs/pkg'
import { Card, VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import { ItemIcon } from './ItemIcon'
import { ItemRow } from './ItemRow'
import './ItemTransfer.css'
import { TitledCard } from './TitledCard'
import {
  ItemTransferDatabase,
  ItemTransferSource,
  ScarletVioletItemTransfer,
} from './transferSource'

interface ItemTransferProps {
  source1: ItemTransferSource
  source2: ItemTransferSource
}

type Source = 'source1' | 'source2'
const NO_POUCH = 4294967295

function useSourceController(source: ItemTransferSource) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const items = source.getItemData()
  // .filter((item) => !(item.pouch === NO_POUCH && item.count === 0))
  const item = selection ? items.find((item) => item.index === selection) : undefined

  const database: ItemTransferDatabase = ScarletVioletItemTransfer

  return { item, items, selection, setSelection, source, database }
}

export function ItemTransfer(props: ItemTransferProps) {
  const { source1, source2 } = props
  const parentRef = useRef(null)
  const [selectedSourceId, setSelectedSourceId] = useState<Option<Source>>()

  const source1Controller = useSourceController(source1)
  const source2Controller = useSourceController(source2)

  const selectedSourceController =
    selectedSourceId === 'source1' ? source1Controller : source2Controller

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <TitledCard title={renderSource(source1.sourceType)} side="left">
          <SaveItemsScroller
            sourceController={source1Controller}
            active={selectedSourceId === 'source1'}
            onClick={() => setSelectedSourceId('source1')}
          />
        </TitledCard>
        <TitledCard title={renderSource(source2.sourceType)} side="right">
          <SaveItemsScroller
            sourceController={source2Controller}
            active={selectedSourceId === 'source2'}
            onClick={() => setSelectedSourceId('source2')}
          />
        </TitledCard>
      </OhoFlex.RowEqualSized>
      <ItemTransferControls
        sourceController={selectedSourceController}
        destController={
          selectedSourceController === source1Controller ? source2Controller : source1Controller
        }
        side={selectedSourceId === 'source1' ? 'right' : 'left'}
      />
    </div>
  )
}

function renderSource(source: OriginGame | 'OpenHome') {
  return source === 'OpenHome' ? (
    <Badge.OpenHome />
  ) : (
    <Badge.Game originGame={source} withName style={{ width: 'fit-content' }} />
  )
}

type ItemTransferCardProps = {
  sourceController: Option<SourceController>
  destController: Option<SourceController>
  side: 'left' | 'right'
}

function ItemTransferControls(props: ItemTransferCardProps) {
  const [itemCount, setItemCount] = useState(props.sourceController?.item?.count ? 1 : 0)
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
        if (sourceItem?.index) {
          props.sourceController?.source.removeItems(sourceItem?.index, itemCount)
          props.destController?.source.addItems(sourceItem?.index, itemCount)
        }
      }}
    >
      {props.side === 'left' && <ArrowUpIcon />}
      Send Items
      {props.side === 'right' && <ArrowUpIcon />}
    </OhoButton>
  )

  return (
    <div className="item-transfer-card">
      {props.side === 'left' && button}
      <Card style={{ padding: 'var(--padding-radius-sm-lg)', flex: 1 }}>
        <OhoFlex.Row justify={props.side === 'left' ? 'end' : 'start'} align="center" gap="3">
          <ItemIcon item={sourceItem} style={{ width: '1.15rem', height: '1.15rem' }} />
          {sourceItem?.name ? (
            <p>{sourceItem.name}</p>
          ) : (
            <p className="select-item-message">Select Item</p>
          )}
          <p>×</p>
          <LabelledInput.Int
            key={sourceItem?.index}
            value={itemCount}
            onChange={(v) => setItemCount(v ?? 0)}
            style={{ width: '3.25rem' }}
            disabled={!sourceItem}
          />
          <code>/</code>
          <code style={{ width: '3rem' }}>{props.sourceController?.item?.count ?? '--'}</code>
        </OhoFlex.Row>
      </Card>
      {props.side === 'right' && button}
    </div>
  )
}

type SourceController = ReturnType<typeof useSourceController>

interface SaveItemsScrollerProps {
  sourceController: SourceController
  active?: boolean
  onClick?: () => void
}

function SaveItemsScroller(props: SaveItemsScrollerProps) {
  const { sourceController } = props
  const parentRef = useRef(null)

  const virtualizer = useSimpleVirtualizer(
    sourceController.items.length,
    (_, baseFontSize) => baseFontSize * 3,
    parentRef
  )

  return (
    <div ref={parentRef} className="item-scroller">
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = sourceController.items[virtualRow.index]
        return (
          <ItemRow
            key={item.index}
            itemData={item}
            database={sourceController.database}
            selected={sourceController.selection === item.index}
            inactive={props.active === false}
            disallowed={item.pouch === 4294967295}
            onClick={() => {
              sourceController.setSelection(item.index)
              props.onClick?.()
            }}
          />
        )
      })}
    </div>
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
