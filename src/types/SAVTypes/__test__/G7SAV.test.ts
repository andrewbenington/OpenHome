import { readFileSync } from 'fs'
import { resolve } from 'path'
import { get16BitChecksumLittleEndian } from '../../../util/byteLogic'
import { PathData } from '../path'
import { SMSAV } from '../SMSAV'
import { USUMSAV } from '../USUMSAV'

describe('gen 7 save files', () => {
  let ultraSunSave: USUMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'SAVFiles/ultrasun')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'SAVFiles/ultrasun',
      name: 'ultrasun',
      dir: 'SAVFiles',
      ext: '',
      separator: '/',
    }

    ultraSunSave = new USUMSAV(parsedPath, saveBytes)
  })

  test('should have expected trainer name', () => {
    expect(ultraSunSave.name).toBe('RoC')
  })

  test('first mon is as expected', () => {
    expect(ultraSunSave.boxes[0].pokemon[0]?.nickname === 'Bulbasaur')
  })
})

describe('moon save file', () => {
  let moonSav: SMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, 'SAVFiles/moon')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: 'SAVFiles/moon',
      name: 'moon',
      dir: 'SAVFiles',
      ext: '',
      separator: '/',
    }

    moonSav = new SMSAV(parsedPath, saveBytes)
  })

  test('should have expected trainer name', () => {
    expect(moonSav.name).toBe('RoC')
  })

  test('first mon is as expected', () => {
    expect(moonSav.boxes[0].pokemon[0]?.nickname === 'Bulbasaur')
  })

  test('checksum test', () => {
    console.log(
      get16BitChecksumLittleEndian(
        new Uint8Array([0xff, 0xdd, 0xcc, 0xaa, 0x34, 0x43]).buffer,
        0,
        6
      )
    )
  })
})
