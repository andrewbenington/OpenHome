import { PA8, PK4, PK8 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { xorChecksum32BitLe } from '@openhome-core/util'
import { Ball, ConvertStrategies, OriginGame } from '@pkm-rs/pkg'
import { readFileSync } from 'fs'
import path from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { PKMInterface } from '../../pkm/interfaces'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { LegendsArceusSave } from '../Gen89/LegendsArceus'
import { SwordShieldSave } from '../Gen89/SwordShieldSave'
import { PathData } from '../util/path'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

function pkmTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'pkm-files', ...pathElements)
}

function saveTestFilePath(...pathElements: string[]): string {
  return path.join(__dirname, 'save-files', ...pathElements)
}

const swordPath: PathData = {
  raw: 'save-files/sword',
  name: 'sword',
  dir: 'save-files',
  ext: '',
  separator: '/',
}

const arceusPath = {
  raw: 'save-files/legendsarceus',
  name: 'legendsarceus',
  dir: 'save-files',
  ext: '',
  separator: '/',
}

describe('gen 8 save files', () => {
  let swordSaveBytes: Uint8Array
  let swordSave: SwordShieldSave
  let arceusSaveBytes: Uint8Array
  let arceusSave: LegendsArceusSave
  let magmortar: PK4

  beforeAll(() => {
    let savePath = saveTestFilePath('sword')

    swordSaveBytes = new Uint8Array(readFileSync(savePath))

    swordSave = new SwordShieldSave(swordPath, swordSaveBytes)

    savePath = saveTestFilePath('legendsarceus')

    arceusSaveBytes = new Uint8Array(readFileSync(savePath))

    arceusSave = new LegendsArceusSave(arceusPath, arceusSaveBytes)

    const monPath = pkmTestFilePath('pk4', 'magmortar.pkm')
    const monBytes = new Uint8Array(readFileSync(monPath))

    magmortar = PK4.fromBytes(monBytes.buffer)
  })

  test('sword/shield hash matches', () => {
    const storedHash = swordSaveBytes.slice(-SwishCrypto.SIZE_HASH)
    const dataBeforeHash = swordSaveBytes.slice(0, -SwishCrypto.SIZE_HASH)
    const computedHash = SwishCrypto.computeHash(dataBeforeHash)

    expect(toHexString(storedHash)).toEqual(toHexString(computedHash))
  })

  test('SwishCrypto hash matches', () => {
    const valid = SwishCrypto.getIsHashValid(swordSaveBytes)

    expect(valid).toBe(true)
  })

  test('sword data is correct', () => {
    expect(swordSave.origin).toBe(OriginGame.Sword)
    expect(swordSave.currentPCBox).toBe(15)
    expect(swordSave.getBoxName(17)).toBe('huevos sorpresa')

    const flapple = swordSave.getMonAt(1, 3)

    expect(flapple?.nickname).toBe('Flapple')
    expect(flapple?.canGigantamax).toBe(true)
    expect(flapple?.ball).toBe(Ball.Premier)
    expect(flapple?.getLevel()).toBe(100)
  })

  test('arceus data is correct', () => {
    expect(arceusSave.origin).toBe(OriginGame.LegendsArceus)
    expect(arceusSave.currentPCBox).toBe(13)
  })

  test('reencrypt sword/shield', () => {
    const reencrypted = SwishCrypto.encrypt(swordSave.scBlocks, swordSave.bytes.length)

    expect(SwishCrypto.getIsHashValid(reencrypted)).toBe(true)
    const decrypted = new SwordShieldSave(swordPath, reencrypted)

    expect(decrypted.name).toBe(swordSave.name)

    const flapple = decrypted.getMonAt(1, 3)

    expect(flapple?.nickname).toBe('Flapple')
    expect(flapple?.canGigantamax).toBe(true)
    expect(flapple?.ball).toBe(Ball.Premier)
    expect(flapple?.getLevel()).toBe(100)

    const mon = swordSave.getMonAt(1, 3)

    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = OHPKM.fromMonInSave(mon, swordSave)

    ohpkm.nickname = 'NEW NAME'
    swordSave.setMonAt(1, 3, convertToPk8(ohpkm))
    swordSave.updatedBoxSlots.push({ box: 1, boxSlot: 3 })

    swordSave.prepareForSaving()
    const modified = new SwordShieldSave(swordPath, swordSave.bytes)
    const modifiedFlapple = modified.getMonAt(1, 3)

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
  })

  test('sword save boxes', () => {
    const mon = swordSave.getMonAt(1, 3)
    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = OHPKM.fromMonInSave(mon, swordSave)

    ohpkm.nickname = 'NEW NAME'
    swordSave.setMonAt(1, 3, convertToPk8(ohpkm))
    swordSave.updatedBoxSlots.push({ box: 1, boxSlot: 3 })

    swordSave.prepareForSaving()
    const modified = new SwordShieldSave(swordPath, swordSave.bytes)
    const modifiedFlapple = modified.getMonAt(1, 3)

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(swordSave.bytes)).toBe(true)
  })

  test('legends arceus writes back to identical bytes', () => {
    expect(xorChecksum32BitLe(arceusSave.prepareWriter().bytes)).toBe(
      xorChecksum32BitLe(arceusSaveBytes)
    )
  })

  test('legends arceus save boxes', () => {
    const mon = arceusSave.getMonAt(13, 1)

    if (!mon) {
      throw new Error('Expected mon not found')
    }
    expect(mon.nickname).toBe('Decidueye')

    const ohpkm = OHPKM.fromMonInSave(mon, arceusSave)

    ohpkm.nickname = 'NEW NAME'
    arceusSave.setMonAt(13, 1, convertToPa8(ohpkm))
    arceusSave.updatedBoxSlots.push({ box: 13, boxSlot: 1 })

    arceusSave.setMonAt(2, 8, convertToPa8(magmortar))
    arceusSave.updatedBoxSlots.push({ box: 2, boxSlot: 8 })

    arceusSave.prepareForSaving()
    const modified = new LegendsArceusSave(arceusPath, arceusSave.bytes)
    const modifiedDecidueye = modified.getMonAt(13, 1)

    expect(modifiedDecidueye?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(arceusSave.bytes)).toBe(true)

    const modifiedMagmortar = modified.getMonAt(2, 8)

    expect(modifiedMagmortar?.nickname).toBe('Magmortar')
  })
})

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  })
    .join('')
    .toUpperCase()
}

function convertToPk8(mon: PKMInterface) {
  return mon instanceof OHPKM
    ? PK8.fromOhpkm(mon, ConvertStrategies.getDefault())
    : PK8.fromOhpkm(OHPKM.fromMonUnknownSave(mon), ConvertStrategies.getDefault())
}

function convertToPa8(mon: PKMInterface) {
  return mon instanceof OHPKM
    ? PA8.fromOhpkm(mon, ConvertStrategies.getDefault())
    : PA8.fromOhpkm(OHPKM.fromMonUnknownSave(mon), ConvertStrategies.getDefault())
}
