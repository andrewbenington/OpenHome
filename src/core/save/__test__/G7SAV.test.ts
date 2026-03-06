import { readFileSync } from 'fs'
import { resolve } from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { SMSAV } from '../SMSAV'
import { USUMSAV } from '../USUMSAV'
import { PathData } from '../util/path'
import { initializeWasm } from './init'
import { fail } from 'assert'

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
