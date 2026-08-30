import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option } from '@openhome-core/util/functional'
import { CtxMenuElementBuilder } from '@openhome-ui/components/context-menu'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation } from '@openhome-ui/state/saves'
import { Suspense, use, useEffect, useEffectEvent, useState } from 'react'
import '../style.css'
import BoxCell from './BoxCell'

type MonWithOpenHomeId = PKMInterface & { openhomeId: string }

interface BoxCellAsyncProps {
  title?: string
  onClick: () => void
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
  const ohpkmStore = useOhpkmStore()
  const [monPromise, setMonPromise] = useState<Promise<Option<OHPKM>>>()

  const getOhpkmById = useEffectEvent((openhomeId: OhpkmIdentifier) =>
    ohpkmStore.getById(openhomeId)
  )

  useEffect(() => {
    setMonPromise(props.openhomeId ? getOhpkmById(props.openhomeId) : undefined)
  }, [props.openhomeId])

  return (
    <Suspense
      fallback={
        <img
          src="/items/index/0000.png"
          alt=""
          aria-hidden
          draggable={false}
          style={{ width: '2.75rem', padding: '0.5rem' }}
        />
      }
    >
      <BoxCellAsyncInner {...props} monPromise={monPromise} />
    </Suspense>
  )
}

function BoxCellAsyncInner(props: BoxCellAsyncProps & { monPromise?: Promise<Option<OHPKM>> }) {
  const { monPromise, ...boxCellProps } = props
  const mon = monPromise ? use(monPromise) : undefined

  return <BoxCell {...boxCellProps} mon={mon} />
}

export default BoxCellAsync
