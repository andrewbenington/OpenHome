import fs from 'fs'
import { TextDecoder } from 'node:util' // (ESM style imports)
import path from 'path'
import { bytesToPKM } from '../../../util/FileImport'
import { PK2 } from '../../PKMTypes'
import { G2SAV } from '../G2SAV'
import { buildSaveFile } from '../util'
;(global as any).TextDecoder = TextDecoder

const crystalSaveFile = buildSaveFile(
  '',
  new Uint8Array(
    fs.readFileSync(path.join(__dirname, './SAVFiles', 'crystal.sav'))
  ),
  {}
) as G2SAV

const slowpokeOH = bytesToPKM(
  new Uint8Array(
    fs.readFileSync(
      path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm')
    )
  ),
  'OHPKM'
)

test('pc box decoded correctly', () => {
  expect(crystalSaveFile.boxes[9].pokemon[0]?.nickname).toEqual('AMPHAROS')
  expect(crystalSaveFile.boxes[9].pokemon[1]?.nickname).toEqual('BELLOSSOM')
  expect(crystalSaveFile.boxes[9].pokemon[18]?.nickname).toEqual('SLOWKING')
  expect(crystalSaveFile.boxes[9].pokemon[19]?.nickname).toEqual('MISDREAVUS')
})

test('removing mon shifts others in box', () => {
  const modifiedSaveFile1 = buildSaveFile(
    '',
    new Uint8Array(crystalSaveFile.bytes),
    {}
  ) as G2SAV
  modifiedSaveFile1.boxes[9].pokemon[0] = undefined
  modifiedSaveFile1.updatedBoxSlots.push({ box: 9, index: 0 })
  modifiedSaveFile1.prepareBoxesForSaving()

  const modifiedSaveFile2 = buildSaveFile(
    '',
    new Uint8Array(modifiedSaveFile1.bytes),
    {}
  ) as G2SAV
  expect(modifiedSaveFile2.boxes[9].pokemon[0]?.nickname).toEqual('BELLOSSOM')
  expect(modifiedSaveFile2.boxes[9].pokemon[18]?.nickname).toEqual('MISDREAVUS')
  expect(modifiedSaveFile2.boxes[9].pokemon[19]).toEqual(undefined)
})

test('inserting mon works', () => {
  const modifiedSaveFile1 = buildSaveFile(
    '',
    new Uint8Array(crystalSaveFile.bytes),
    {}
  ) as G2SAV
  modifiedSaveFile1.boxes[13].pokemon[17] = new PK2(slowpokeOH)
  modifiedSaveFile1.updatedBoxSlots.push({ box: 13, index: 0 })
  modifiedSaveFile1.prepareBoxesForSaving()

  const modifiedSaveFile2 = buildSaveFile(
    '',
    new Uint8Array(modifiedSaveFile1.bytes),
    {}
  ) as G2SAV
  expect(modifiedSaveFile2.boxes[13].pokemon[0]?.nickname).toEqual('UNOWN')
  expect(modifiedSaveFile2.boxes[13].pokemon[16]?.nickname).toEqual(
    'WIGGLYTUFF'
  )
  expect(modifiedSaveFile2.boxes[13].pokemon[17]?.nickname).toEqual('Slowpoke')
})
