import useBackend from '@openhome-core/backend/useBackend'
import { $R, Result } from '@openhome-core/util/functional'
import { Spinner } from '@radix-ui/themes'
import { Suspense, use, useState } from 'react'
import { PKM_RS_WASM } from '../init'
import OhoButton from './components/OhoButton'
import OhoFlex from './components/OhoFlex'

export function AppFooter() {
  const [wasmSize, setWasmSize] = useState(wasmSizeDisplay())
  const backend = useBackend()
  const ohpkmCountResult = backend.getOhpkmCount()

  return (
    <div className="app-footer">
      OHPKM Count:{' '}
      <Suspense fallback={<Spinner />}>
        <OhpkmCount promise={ohpkmCountResult} />
      </Suspense>
      <OhoFlex.Spacer />
      <p style={{ fontSize: '0.8rem' }}>WASM memory usage:</p>
      <code>{wasmSize}</code>
      <OhoButton
        size="1"
        onClick={() => setWasmSize(wasmSizeDisplay())}
        style={{ fontSize: '0.7rem', padding: '0.1rem', height: 'fit-content' }}
      >
        Refresh
      </OhoButton>
    </div>
  )
}

function wasmSizeDisplay() {
  return PKM_RS_WASM
    ? (PKM_RS_WASM.memory.buffer.byteLength / 1024 / 1024).toFixed(1) + ' MB'
    : 'loading...'
}

type OhpkmCountProps = {
  promise: Promise<Result<number>>
}

function OhpkmCount({ promise }: OhpkmCountProps) {
  const result = use(promise)

  return $R(result).match(
    (count) => <code>{count}</code>,
    (error) => <div>{error}</div>
  )
}
