import init from '@pkm-rs/pkg'
import '@testing-library/jest-dom/vitest'
import fs from 'fs'
import { enableMapSet } from 'immer'
import path from 'path'
import { vi } from 'vitest'
import { addMissingFunctions } from './polyfill'

vi.mock('zustand') // auto-mocking zustand store functions
enableMapSet()

addMissingFunctions()

const wasmPath = path.resolve(__dirname, '../pkm_rs/pkg/pkm_rs_bg.wasm')
const wasmBytes = fs.readFileSync(wasmPath)

init({ module_or_path: wasmBytes })
