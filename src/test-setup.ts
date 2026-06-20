import init from '@pkm-rs/pkg'
import '@testing-library/jest-dom/vitest'
import fs from 'fs'
import { enableMapSet } from 'immer'
import path from 'path'
import { beforeAll, vi } from 'vitest'

vi.mock('zustand') // auto-mocking zustand store functions
enableMapSet()

beforeAll(async () => {
  // remove when ES2025 is supported
  if (!Uint8Array.prototype.toHex) {
    Uint8Array.prototype.toHex = function () {
      return Array.from(this)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
  }

  const wasmPath = path.resolve(__dirname, '../pkm_rs/pkg/pkm_rs_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
})
