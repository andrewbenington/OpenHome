import '@testing-library/jest-dom/vitest'
import fs from 'fs'
import { enableMapSet } from 'immer'
import path from 'path'
import { beforeAll, vi } from 'vitest'

import init from '@pkm-rs/pkg'

vi.mock('zustand') // auto-mocking zustand store functions
enableMapSet()

beforeAll(async () => {
  const wasmPath = path.resolve(__dirname, '../pkm_rs/pkg/pkm_rs_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
})
