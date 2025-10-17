import fs from 'fs'
import path from 'path'
import init from '../../../../pkm_rs_resources/pkg/pkm_rs_resources.js'

export async function initializeWasm() {
  const wasmPath = path.resolve(
    __dirname,
    '../../../../pkm_rs_resources/pkg/pkm_rs_resources_bg.wasm'
  )
  const wasmBytes = fs.readFileSync(wasmPath)
  await init({ module_or_path: wasmBytes })
}
