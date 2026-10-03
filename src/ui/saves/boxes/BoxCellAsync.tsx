import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { $R, isResult, Option } from '@openhome-core/util/functional'
import { NowOrLater } from '@openhome-core/util/promise'
import { CtxMenuElementBuilder } from '@openhome-ui/components/context-menu'
import MissingOhpkmIdPrompt from '@openhome-ui/pokemon/MissingOhpkmId'
import { OhpkmLookupResult } from '@openhome-ui/state/ohpkm'
import { MonLocation } from '@openhome-ui/state/saves'
import { CSSProperties, Suspense, use } from 'react'
import '../style.css'
import BoxCell from './BoxCell'

export type BoxSlotContents = NowOrLater<Option<PKMInterface | OhpkmLookupResult>>

interface BoxCellAsyncProps {
  title?: string
  onClick: () => void
  monPlaceholder?: Option<PKMInterface>
  monPromise?: BoxSlotContents
  onDrop: (_: PKMInterface[]) => void
  isDisabled?: (mon: Option<PKMInterface>) => boolean
  disabledReason?: string
  openhomeId?: OhpkmIdentifier
  borderColor?: CSSProperties['color']
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
    <BoxCell {...props} mon={props.monPromise} disabled={props.isDisabled?.(undefined)} />
  )
}

function BoxCellAsyncInner(props: BoxCellAsyncProps & { monPromise: BoxSlotContents }) {
  const { monPromise, isDisabled, ...boxCellProps } = props
  const awaitedContents = isThenable(monPromise) ? use(monPromise) : monPromise

  if (awaitedContents && isResult(awaitedContents)) {
    return $R(awaitedContents).match(
      (ohpkm) => (
        <BoxCell
          {...boxCellProps}
          mon={ohpkm}
          disabled={isDisabled?.(ohpkm)}
          borderColor={props.borderColor}
        />
      ),
      ({ identifier }) => {
        return (
          <MissingOhpkmIdPrompt
            location={props.location.isHome ? props.location : undefined}
            openhomeId={identifier}
          />
        )
      }
    )
  }

  const mon: Option<PKMInterface> = awaitedContents

  return (
    <BoxCell
      {...boxCellProps}
      mon={mon}
      disabled={mon && isDisabled?.(mon)}
      borderColor={props.borderColor}
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
