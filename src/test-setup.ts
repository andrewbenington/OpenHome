import init from '@pkm-rs/pkg'
import '@testing-library/jest-dom/vitest'
import fs from 'fs'
import { enableMapSet } from 'immer'
import path from 'path'
import { beforeAll, vi } from 'vitest'

vi.mock('zustand') // auto-mocking zustand store functions
enableMapSet()

// remove when ES2025 is supported by vitest
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

if (!Uint8Array.fromHex) {
  Uint8Array.fromHex = function (hex: string) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
  }
}

beforeAll(async () => {
  const wasmPath = path.resolve(__dirname, '../pkm_rs/pkg/pkm_rs_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
})
