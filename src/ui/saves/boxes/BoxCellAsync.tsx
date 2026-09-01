import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option } from '@openhome-core/util/functional'
import { CtxMenuElementBuilder } from '@openhome-ui/components/context-menu'
import { MonLocation } from '@openhome-ui/state/saves'
import { Suspense, use } from 'react'
import '../style.css'
import BoxCell from './BoxCell'

interface BoxCellAsyncProps {
  title?: string
  onClick: () => void
  monPromise?: Promise<Option<OHPKM>>
  onDrop: (_: PKMInterface[]) => void
  disabled?: boolean
  disabledReason?: string
  openhomeId?: OhpkmIdentifier
  borderColor?: string
  dragID: string
  location: MonLocation
  contextMenu?: CtxMenuElementBuilder[]
  isSelected?: boolean
  onToggleSelect?: () => void
  multiSelectEnabled?: boolean
}

function BoxCellAsync(props: BoxCellAsyncProps) {
  return props.monPromise ? (
    <Suspense
      fallback={
        <img
          src="/items/index/0000.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{ width: '2.75rem', padding: '0.5rem', backgroundColor: '#6662' }}
        />
      }
    >
      <BoxCellAsyncInner {...props} monPromise={props.monPromise} />{' '}
    </Suspense>
  ) : (
    <BoxCell {...props} mon={undefined} />
  )
}

function BoxCellAsyncInner(props: BoxCellAsyncProps & { monPromise: Promise<Option<OHPKM>> }) {
  const { monPromise, ...boxCellProps } = props
  const mon = use(monPromise)

  return <BoxCell {...boxCellProps} mon={mon} />
}

export default BoxCellAsync
