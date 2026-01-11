import fs from 'fs'
import path from 'path'
import { beforeAll } from 'vitest'

import init from '../pkm_rs_resources/pkg/pkm_rs_resources.js'

import { doNecessaryPolyfills } from './core/util/polyfill.js'

beforeAll(async () => {
  doNecessaryPolyfills()
  const wasmPath = path.resolve(__dirname, '../pkm_rs_resources/pkg/pkm_rs_resources_bg.wasm')
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
})
