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
import { ItemData, ItemRow } from './ItemRow'
import './ItemTransfer.css'
import { TitledCard } from './TitledCard'

interface ItemTransferProps {
  source1Items: ItemData[]
  source2Items: ItemData[]
  source1: OriginGame | 'OpenHome'
  source2: OriginGame | 'OpenHome'
}

type Source = 'source1' | 'source2'

function useSource(items: ItemData[]) {
  const [selection, setSelection] = useState<Option<number>>(undefined)
  const item = selection ? items.find((item) => item.index === selection) : undefined

  return { item, items, selection, setSelection }
}

export function ItemTransfer(props: ItemTransferProps) {
  const { source1Items, source2Items } = props
  const parentRef = useRef(null)
  const [selectedSourceId, setSelectedSourceId] = useState<Option<Source>>()

  const source1 = useSource(source1Items.filter((item) => item.isObtained))
  const source2 = useSource(source2Items.filter((item) => item.isObtained))

  const selectedSource = selectedSourceId === 'source1' ? source1 : source2

  return (
    <div ref={parentRef} className="save-items-display">
      <OhoFlex.RowEqualSized gridColumn="1 / span 2" gap="1" mx="1" mt="1">
        <TitledCard title={renderSource(props.source1)} side="left">
          <SaveItemsScroller
            sourceController={source1}
            active={selectedSourceId === 'source1'}
            onClick={() => setSelectedSourceId('source1')}
          />
        </TitledCard>
        <TitledCard title={renderSource(props.source2)} side="right">
          <SaveItemsScroller
            sourceController={source2}
            active={selectedSourceId === 'source2'}
            onClick={() => setSelectedSourceId('source2')}
          />
        </TitledCard>
      </OhoFlex.RowEqualSized>
      <ItemTransferControls
        sourceController={selectedSource}
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
  side: 'left' | 'right'
}

function ItemTransferControls(props: ItemTransferCardProps) {
  const sourceItem = props.sourceController?.item
    ? Item.fromIndex(props.sourceController?.item.index)
    : undefined

  const button = (
    <OhoButton
      size="2"
      color="red"
      variant="classic"
      style={{ fontWeight: 'bold', height: '2.5rem', width: '12rem' }}
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
        <OhoFlex.Row justify={props.side === 'left' ? 'end' : 'start'} gap="3">
          <ItemIcon item={sourceItem} style={{ width: '1.25rem', height: '1.25rem' }} />
          <p>{sourceItem?.name}</p>
          <p>×</p>
          <LabelledInput.Int
            key={sourceItem?.index}
            value={props.sourceController?.item?.count ? 1 : 0}
            onChange={console.info}
            style={{ width: '3.25rem' }}
          />
          <code>/</code>
          <code style={{ width: '3rem' }}>{props.sourceController?.item?.count ?? '--'}</code>
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
  // these should be bundled together down the line
  source1: OriginGame | 'OpenHome'
  source1Items: ItemData[]
  source2: OriginGame | 'OpenHome'
  source2Items: ItemData[]
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
            <ItemTransfer
              source1Items={props.source1Items}
              source1={props.source1}
              source2Items={props.source2Items}
              source2={props.source2}
            />
          </Fallback>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
