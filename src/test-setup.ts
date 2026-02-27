import fs from 'fs'
import path from 'path'
import { beforeAll } from 'vitest'

import init from '@pkm-rs/pkg'

beforeAll(async () => {
  const wasmPath = path.resolve(__dirname, '../pkm_rs/pkg/pkm_rs_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
})
