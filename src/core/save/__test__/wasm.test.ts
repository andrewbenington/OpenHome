import { readFileSync } from 'fs'
import path from 'path'
import { describe, test } from 'vitest'
import { LegendsArceusSave } from '../Gen89/LegendsArceus'
import { SwordShieldSave } from '../Gen89/SwordShieldSave'
import { emptyPathData } from '../util/path'
import { initializeWasm } from './init'

export function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'save-files', ...pathElements)
}

const arceusPath = {
  raw: 'save-files/legendsarceus',
  name: 'legendsarceus',
  dir: 'save-files',
  ext: '',
  separator: '/',
}

describe('gen 8 save files', () => {
  test('memory allocation sword/shield', async () => {
    const wasm = await initializeWasm()
    let savePath = saveTestFilePath('sword')

    const swordSaveBytes = new Uint8Array(readFileSync(savePath))

    const swordSave = new SwordShieldSave(emptyPathData, swordSaveBytes)

    const size = () => (wasm.memory.buffer.byteLength / 1024 / 1024).toFixed(1) + ' MB'

    for (let i = 0; i < 50; i++) {
      const mons = swordSave.getAllMons()
      mons.forEach((m) => m.inner.free())
      console.log(i, size())
    }
  })

  test('memory allocation legends arceus', async () => {
    const wasm = await initializeWasm()

    const savePath = saveTestFilePath('legendsarceus')

    const arceusSaveBytes = new Uint8Array(readFileSync(savePath))

    const arceusSave = new LegendsArceusSave(arceusPath, arceusSaveBytes)

    const size = () => (wasm.memory.buffer.byteLength / 1024 / 1024).toFixed(1) + ' MB'

    for (let i = 0; i < 50; i++) {
      arceusSave.getAllMons()
      console.log(i, size())
    }
  })
})
