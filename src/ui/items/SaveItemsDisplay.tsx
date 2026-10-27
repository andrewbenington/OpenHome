import { Option } from '@openhome-core/util/functional'
import Badge from '@openhome-ui/components/badge/Badge'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import Fallback from '@openhome-ui/components/Fallback'
import { ArrowUpIcon } from '@openhome-ui/components/Icons'
import LabelledInput from '@openhome-ui/components/input/LabelledInput'
import OhoButton from '@openhome-ui/components/OhoButton'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import useSimpleVirtualizer from '@openhome-ui/hooks/simpleVirtualizer'
import { Item, ItemDataTs, OriginGame } from '@pkm-rs/pkg'
import { Card, VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import { ItemIcon } from './ItemIcon'
import { ItemRow } from './ItemRow'
import './SaveItemsDisplay.css'
import { TitledCard } from './TitledCard'

interface SaveItemsDisplayProps {
  items: ItemDataTs[]
  source1: OriginGame | 'OpenHome'
  source2: OriginGame | 'OpenHome'
}

type Source = 'source1' | 'source2'

function useSource(items: ItemDataTs[]) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const item = selection ? items.find((item) => item.index === selection) : undefined

  return { item, items, selection, setSelection }
}

export function SaveItemsDisplay(props: SaveItemsDisplayProps) {
  const { items } = props
  const parentRef = useRef(null)
  const [selectedSource, setSelectedSource] = useState<Option<Source>>()

  const filteredItems = items.filter((item) => item.is_obtained)
  const source1 = useSource(filteredItems)
  const source2 = useSource(filteredItems)

  const selectedItem = selectedSource === 'source1' ? source1.item : source2.item

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <TitledCard title={renderSource(props.source1)} side="left">
          <SaveItemsScroller
            sourceController={source1}
            active={selectedSource === 'source1'}
            onClick={() => setSelectedSource('source1')}
          />
        </TitledCard>
        <TitledCard title={renderSource(props.source2)} side="right">
          <SaveItemsScroller
            sourceController={source2}
            active={selectedSource === 'source2'}
            onClick={() => setSelectedSource('source2')}
          />
        </TitledCard>
      </OhoFlex.RowEqualSized>
      <ItemTransferCard
        sourceItemData={selectedItem}
        side={selectedSource === 'source1' ? 'right' : 'left'}
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
  sourceItemData: Option<ItemDataTs>
  side: 'left' | 'right'
}

function ItemTransferCard(props: ItemTransferCardProps) {
  const sourceItem = props.sourceItemData ? Item.fromIndex(props.sourceItemData.index) : undefined

  const button = (
    <OhoButton
      size="2"
      color="red"
      variant="classic"
      style={{ fontWeight: 'bold', margin: 'auto', height: '2.5rem', width: '12rem' }}
    >
      {props.side === 'left' && <ArrowUpIcon />}
      Send Items
      {props.side === 'right' && <ArrowUpIcon />}
    </OhoButton>
  )

  return (
    <div
      className="item-transfer-card"
      style={{ gridColumn: '1 / span 2', flexDirection: 'row-reverse' }}
    >
      {props.side === 'left' && button}
      <Card
        style={{
          padding: 'var(--padding-radius-sm-lg)',
        }}
      >
        <OhoFlex.Row justify={props.side === 'left' ? 'start' : 'end'} gap="3">
          <ItemIcon item={sourceItem} style={{ width: '1.25rem', height: '1.25rem' }} />
          <p>{sourceItem?.name}</p>
          <p>×</p>
          <LabelledInput.Int
            key={sourceItem?.index}
            value={props.sourceItemData?.count ?? 0}
            onChange={console.info}
            style={{ width: '3.25rem' }}
          />
          <code>/</code>
          <code style={{ width: '3rem' }}>{props.sourceItemData?.count ?? '--'}</code>
        </OhoFlex.Row>
      </Card>
      {props.side === 'right' && button}
    </div>
  )
}

type SourceController = ReturnType<typeof useSource>

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
            selected={sourceController.selection === item.index}
            inactive={props.active === false}
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
  items: ItemDataTs[]
  source1: OriginGame | 'OpenHome'
  source2: OriginGame | 'OpenHome'
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
            <SaveItemsDisplay items={props.items} source1={props.source1} source2={props.source2} />
          </Fallback>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
