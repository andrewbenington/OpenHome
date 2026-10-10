import { readFileSync } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'
import { LegendsArceusSave } from '../Gen89/LegendsArceus'
import { SwordShieldSave } from '../Gen89/SwordShieldSave'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'

export function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'save-files', ...pathElements)
}

describe('gen 8 save files', () => {
  test('sword/shield memory allocation is under 9Kb', async () => {
    const wasm = await initializeWasm()
    let savePath = saveTestFilePath('sword')

    const swordSaveBytes = new Uint8Array(readFileSync(savePath))

    const initialWasmMemoryKb = wasm.memory.buffer.byteLength / 1024

    const save = new SwordShieldSave(emptyPathData, swordSaveBytes)
    save.free()
    new SwordShieldSave(emptyPathData, swordSaveBytes)
    const allocatedMemory = wasm.memory.buffer.byteLength / 1024 - initialWasmMemoryKb

    expect(allocatedMemory).toBeLessThan(9000)
  })

  test('sword/shield free() -> realloc reuses memory', async () => {
    const wasm = await initializeWasm()
    let savePath = saveTestFilePath('sword')

    const swordSaveBytes = new Uint8Array(readFileSync(savePath))

    const save = new SwordShieldSave(emptyPathData, swordSaveBytes)
    const initialWasmMemoryKb = wasm.memory.buffer.byteLength / 1024

    save.free()
    new SwordShieldSave(emptyPathData, swordSaveBytes)
    const newlyAllocated = wasm.memory.buffer.byteLength / 1024 - initialWasmMemoryKb

    expect(newlyAllocated).toBe(0)
  })

  test("pkm memory allocation doesn't leak sword/shield", async () => {
    const wasm = await initializeWasm()
    let savePath = saveTestFilePath('sword')

    const swordSaveBytes = new Uint8Array(readFileSync(savePath))

    const swordSave = new SwordShieldSave(emptyPathData, swordSaveBytes)
    const initialWasmMemoryKb = wasm.memory.buffer.byteLength / 1024

    const mons = swordSave.getAllMons()
    mons.forEach((m) => m.inner.free())

    const leakedMemory = wasm.memory.buffer.byteLength / 1024 - initialWasmMemoryKb
    expect(leakedMemory).toBe(0)
  })

  test("pkm memory allocation doesn't leak legends arceus", async () => {
    const wasm = await initializeWasm()
    let savePath = saveTestFilePath('legendsarceus')

    const swordSaveBytes = new Uint8Array(readFileSync(savePath))

    const legendsArceusSave = new LegendsArceusSave(emptyPathData, swordSaveBytes)
    const initialWasmMemoryKb = wasm.memory.buffer.byteLength / 1024

    legendsArceusSave.getAllMons()

    const leakedMemory = wasm.memory.buffer.byteLength / 1024 - initialWasmMemoryKb
    expect(leakedMemory).toBe(0)
  })
})
