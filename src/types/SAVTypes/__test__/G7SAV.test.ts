import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PathData } from '../path'
import { USUMSAV } from '../USUMSAV'

describe('gen 7 save files', () => {
  let ultraSunSave: USUMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, './SAVFILES/ultrasun')

    saveBytes = new Uint8Array(readFileSync(savePath))

    const parsedPath: PathData = {
      raw: './SAVFILES/ultrasun',
      name: 'ultrasun',
      dir: './SAVFILES',
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
