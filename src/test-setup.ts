import fs from 'fs'
import path from 'path'
import { beforeAll } from 'vitest'

import init from '../pkm_rs_resources/pkg/pkm_rs_resources.js'

beforeAll(async () => {
  const wasmPath = path.resolve(__dirname, '../pkm_rs_resources/pkg/pkm_rs_resources_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init(wasmBytes) // this avoids fetch
})
