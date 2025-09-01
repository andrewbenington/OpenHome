import { PK1, PK2, PK3, PK4, PK5 } from '@pokemon-files/pkm'
import { readFileSync } from 'fs'
import path, { resolve } from 'path'
import { generatePersonalityValuePreservingAttributes } from '../../../../packages/pokemon-files/src'
import { getMonGen12Identifier, getMonGen345Identifier } from '../../../util/Lookup'
import { bytesToPKM } from '../../FileImport'
import { OHPKM } from '../OHPKM'

describe('gen345 identifier', () => {
  let blaziken: PK3
  let monBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, './PKMFiles/Gen3/blaziken.pk3')

    monBytes = new Uint8Array(readFileSync(savePath))

    blaziken = new PK3(new Uint8Array(monBytes).buffer)
  })

  test('should have expected name', () => {
    expect(blaziken.nickname).toBe('BLAZIKEN')
  })

  test('lookup should be the same for 3/4/5', () => {
    const ohpkm = new OHPKM(blaziken)

    expect(getMonGen345Identifier(blaziken)).toBe(getMonGen345Identifier(ohpkm))
    const pk3 = new PK3(ohpkm)

    expect(getMonGen345Identifier(pk3)).toBe(getMonGen345Identifier(ohpkm))
    const pk5 = new PK5(ohpkm)
    const pv1 = generatePersonalityValuePreservingAttributes(ohpkm)
    const pv2 = generatePersonalityValuePreservingAttributes(pk5)

    expect(pv2).toBe(pv1)
    expect(getMonGen345Identifier(pk5)).toBe(getMonGen345Identifier(ohpkm))
  })
})

const slowpokeOH = bytesToPKM(
  new Uint8Array(readFileSync(path.join(__dirname, './PKMFiles/OH', 'slowpoke-shiny.ohpkm'))),
  'OHPKM'
) as OHPKM

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
