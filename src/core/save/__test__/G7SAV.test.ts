import { readFileSync } from 'fs'
import { resolve } from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { MemeKey } from '../encryption/MemeKey'
import { SMSAV } from '../SMSAV'
import { USUMSAV } from '../USUMSAV'
import { PathData } from '../util/path'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

describe('gen 7 save files', () => {
  let ultraSunSave: USUMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'save-files/ultrasun')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'save-files/ultrasun',
      name: 'ultrasun',
      dir: 'save-files',
      ext: '',
      separator: '/',
    }

    ultraSunSave = new USUMSAV(parsedPath, saveBytes)
  })

  test('should have expected trainer name', () => {
    expect(ultraSunSave.name).toBe('RoC')
  })

  test('first mon is as expected', () => {
    expect(ultraSunSave.boxes[0].boxSlots[0]?.nickname === 'Bulbasaur')
  })

  test('checksum is expected', () => {
    expect(ultraSunSave.calculatePcChecksum()).toBe(0x4d97)
  })
})

describe('moon save file', () => {
  let moonSav: SMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'save-files/moon')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'save-files/moon',
      name: 'moon',
      dir: 'save-files',
      ext: '',
      separator: '/',
    }

    moonSav = new SMSAV(parsedPath, saveBytes)
  })

  test('should have expected trainer name', () => {
    expect(moonSav.name).toBe('RoC')
  })

  test('first mon is as expected', () => {
    expect(moonSav.boxes[0].boxSlots[0]?.nickname === 'Bulbasaur')
  })

  test('checksum is expected', () => {
    expect(moonSav.calculatePcChecksum()).toBe(0xb28d)
  })
})

describe('meme key', () => {
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'save-files/moon')

    saveBytes = new Uint8Array(readFileSync(savePath))
  })

  test('meme key values are accurate', () => {
    const memeKey = new MemeKey(saveBytes)
    expect(memeKey.getPrivateKeyU16()).toBe(
      '775455668fff3cba3026c2d0b26b8085895958341157aeb03b6b0495ee57803e2186eb6cb2eb62a71df18a3c9c6579077670961b3a6102dabe5a194ab58c3250aed597fc78978a326db1d7b28dcccb2a3e014edbd397ad33b8f28cd525054251'
    )
    expect(memeKey.getPublicKeyU16()).toBe('5224')
    expect(memeKey.getModU16()).toBe(
      'd9040000fb0400000e28000008280000de0400003b060000da0400005ec800000628000056130000f50400001e060000ee0400004e5b01005b14000007300000f304000057070000c0060000f90400000f2800005918000053200000ef04000028'
    )
  })
})
