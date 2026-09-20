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
  monPlaceholder?: Option<PKMInterface>
  monPromise?: Promise<Option<PKMInterface>> | Option<PKMInterface>
  onDrop: (_: PKMInterface[]) => void
  isDisabled?: (mon: PKMInterface) => boolean
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
        props.monPlaceholder ? (
          <BoxCell
            {...props}
            mon={props.monPlaceholder}
            disabled={props.isDisabled?.(props.monPlaceholder)}
            borderColor="yellow"
          />
        ) : (
          <div
            className="box-cell box-cell-loading"
            style={{
              backgroundColor: '#6662',
            }}
          >
            <img
              src="/items/index/0000.png"
              alt=""
              aria-hidden
              draggable={false}
              style={{
                width: 'calc(0.7 * var(--box-cell-size))',
                aspectRatio: 1,
                padding: '0.25rem',
              }}
            />
          </div>
        )
      }
    >
      <BoxCellAsyncInner {...props} monPromise={props.monPromise} />
    </Suspense>
  ) : (
    <BoxCell {...props} mon={props.monPromise} borderColor="grey" />
  )
}

function BoxCellAsyncInner(
  props: BoxCellAsyncProps & { monPromise: Promise<Option<PKMInterface>> | Option<PKMInterface> }
) {
  const { monPromise, isDisabled, ...boxCellProps } = props
  const mon = isThenable(monPromise) ? use(monPromise) : monPromise

  return (
    <BoxCell
      {...boxCellProps}
      mon={mon}
      disabled={mon && isDisabled?.(mon)}
      borderColor={mon instanceof OHPKM ? 'teal' : 'purple'}
    />
  )
}

export default BoxCellAsync

function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}
