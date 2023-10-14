import fs from 'fs'
import { TextDecoder } from 'node:util'
import path from 'path'
import { bytesToPKM } from '../../../util/FileImport'
import { getMonGen12Identifier, getMonGen345Identifier } from '../../../util/Lookup'
import { OHPKM } from '../OHPKM'
import { PK1 } from '../PK1'
import { PK2 } from '../PK2'
import { PK3 } from '../PK3'
import { PK4 } from '../PK4'
;(global as any).TextDecoder = TextDecoder

const blazikenOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'blaziken.ohpkm'))),
  'OHPKM'
) as OHPKM

const slowpokeOH = bytesToPKM(
  new Uint8Array(fs.readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
)

test('ohpkm conversion to OHPKM and back is lossless', () => {
  const ohPKM = new OHPKM(blazikenOH)
  // gaining cool contest points
  expect(blazikenOH.personalityValue).toEqual(ohPKM.personalityValue)
})

test('converted ohpkm always has the same gen1 lookup key', () => {
  const lookup = getMonGen12Identifier(slowpokeOH)
  for (let i = 0; i < 100; i++) {
    expect(lookup).toEqual(getMonGen12Identifier(new PK1(slowpokeOH)))
  }
})

test('converted ohpkm always has the same gen2 lookup key', () => {
  const lookup = getMonGen12Identifier(slowpokeOH)
  for (let i = 0; i < 100; i++) {
    expect(lookup).toEqual(getMonGen12Identifier(new PK2(slowpokeOH)))
  }
})

test('converted ohpkm always has the same gen3 lookup key', () => {
  const lookup = getMonGen345Identifier(slowpokeOH)
  for (let i = 0; i < 100; i++) {
    expect(lookup).toEqual(getMonGen345Identifier(new PK3(slowpokeOH)))
  }
})

test('converted ohpkm always has the same gen4 lookup key', () => {
  const lookup = getMonGen345Identifier(slowpokeOH)
  for (let i = 0; i < 100; i++) {
    expect(lookup).toEqual(getMonGen345Identifier(new PK4(slowpokeOH)))
  }
})
