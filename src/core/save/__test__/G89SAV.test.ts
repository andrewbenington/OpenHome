import { PA8, PK4, PK8 } from '@openhome-core/pkm'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { toBase64 } from '@openhome-core/util'
import { Ball, ConvertStrategies, OriginGame } from '@pkm-rs/pkg'
import { readFileSync } from 'fs'
import path from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { PKMInterface } from '../../pkm/interfaces'
import { SCBoolBlock, SCObjectBlock, writeSCBlock } from '../encryption/SwishCrypto/SCBlock'
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
  let saveBytes: Uint8Array
  let swordSave: SwordShieldSave
  let arceusSave: LegendsArceusSave
  let magmortar: PK4

  beforeAll(() => {
    let savePath = saveTestFilePath('sword')

    saveBytes = new Uint8Array(readFileSync(savePath))

    swordSave = new SwordShieldSave(swordPath, saveBytes)

    savePath = saveTestFilePath('legendsarceus')

    saveBytes = new Uint8Array(readFileSync(savePath))

    arceusSave = new LegendsArceusSave(arceusPath, saveBytes)

    const monPath = pkmTestFilePath('pk4', 'magmortar.pkm')
    const monBytes = new Uint8Array(readFileSync(monPath))

    magmortar = PK4.fromBytes(monBytes.buffer)
  })

  test('sword/shield hash matches', () => {
    const storedHash = saveBytes.slice(-SwishCrypto.SIZE_HASH)
    const dataBeforeHash = saveBytes.slice(0, -SwishCrypto.SIZE_HASH)
    const computedHash = SwishCrypto.computeHash(dataBeforeHash)

    expect(toHexString(storedHash)).toEqual(toHexString(computedHash))
  })

  test('SwishCrypto hash matches', () => {
    const valid = SwishCrypto.getIsHashValid(saveBytes)

    expect(valid).toBe(true)
  })

  test('sword data is correct', () => {
    expect(swordSave.origin).toBe(OriginGame.Sword)
    expect(swordSave.currentPCBox).toBe(15)
    expect(swordSave.boxes[17].name).toBe('huevos sorpresa')

    const flapple = swordSave.boxes[1].boxSlots[3]

    expect(flapple?.nickname).toBe('Flapple')
    expect(flapple?.canGigantamax).toBe(true)
    expect(flapple?.ball).toBe(Ball.Premier)
    expect(flapple?.getLevel()).toBe(100)
  })

  test('arceus data is correct', () => {
    expect(arceusSave.origin).toBe(OriginGame.LegendsArceus)
    expect(arceusSave.currentPCBox).toBe(13)
  })

  test('write sc block', () => {
    const block: SCObjectBlock = {
      blockType: 'object',
      raw: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
      key: 0xdeadbeef,
      type: 'Object',
    }

    const buffer = new Uint8Array(60)

    let offset = 0

    offset = writeSCBlock(block, buffer, offset)
    expect(offset).toBe(17)

    const block2: SCObjectBlock = {
      blockType: 'object',
      raw: new Uint8Array([5, 7, 5]).buffer,
      key: 0xefe00efe,
      type: 'Object',
    }

    offset = writeSCBlock(block2, buffer, offset)
    expect(offset).toBe(29)

    const block3: SCBoolBlock = {
      blockType: 'bool',
      key: 0xefe00efe,
      type: { Scalar: 'Bool1' },
    }

    offset = writeSCBlock(block3, buffer, offset)
    expect(offset).toBe(34)
    expect(toBase64(buffer)).toBe(
      '776t3ttO+0yPQmWoQ6X0SSP+DuDv9QDcCG3+xqX+DuDv8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    )
  })

  test('reencrypt sword/shield', () => {
    const reencrypted = SwishCrypto.encrypt(swordSave.scBlocks, swordSave.bytes.length)

    expect(SwishCrypto.getIsHashValid(reencrypted)).toBe(true)
    const decrypted = new SwordShieldSave(swordPath, reencrypted)

    expect(decrypted.name).toBe(swordSave.name)

    const flapple = decrypted.boxes[1].boxSlots[3]

    expect(flapple?.nickname).toBe('Flapple')
    expect(flapple?.canGigantamax).toBe(true)
    expect(flapple?.ball).toBe(Ball.Premier)
    expect(flapple?.getLevel()).toBe(100)

    const mon = swordSave.boxes[1].boxSlots[3]

    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = OHPKM.fromMonInSave(mon, swordSave)

    ohpkm.nickname = 'NEW NAME'
    swordSave.boxes[1].boxSlots[3] = convertToPk8(ohpkm)
    swordSave.updatedBoxSlots.push({ box: 1, boxSlot: 3 })

    swordSave.prepareForSaving()
    const modified = new SwordShieldSave(swordPath, swordSave.bytes)
    const modifiedFlapple = modified.boxes[1].boxSlots[3]

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
  })

  test('sword save boxes', () => {
    const mon = swordSave.boxes[1].boxSlots[3]

    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = OHPKM.fromMonInSave(mon, swordSave)

    ohpkm.nickname = 'NEW NAME'
    swordSave.boxes[1].boxSlots[3] = convertToPk8(ohpkm)
    swordSave.updatedBoxSlots.push({ box: 1, boxSlot: 3 })

    swordSave.prepareForSaving()
    const modified = new SwordShieldSave(swordPath, swordSave.bytes)
    const modifiedFlapple = modified.boxes[1].boxSlots[3]

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(swordSave.bytes)).toBe(true)
  })

  test('legends arceus save boxes', () => {
    const mon = arceusSave.boxes[13].boxSlots[1]

    if (!mon) {
      throw new Error('Expected mon not found')
    }
    expect(mon.nickname).toBe('Decidueye')

    const ohpkm = OHPKM.fromMonInSave(mon, arceusSave)

    ohpkm.nickname = 'NEW NAME'
    arceusSave.boxes[13].boxSlots[1] = convertToPa8(ohpkm)
    arceusSave.updatedBoxSlots.push({ box: 13, boxSlot: 1 })

    arceusSave.boxes[2].boxSlots[8] = convertToPa8(magmortar)
    arceusSave.updatedBoxSlots.push({ box: 2, boxSlot: 8 })

    arceusSave.prepareForSaving()
    const modified = new LegendsArceusSave(arceusPath, arceusSave.bytes)
    const modifiedDecidueye = modified.boxes[13].boxSlots[1]

    expect(modifiedDecidueye?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(arceusSave.bytes)).toBe(true)

    const modifiedMagmortar = modified.boxes[2].boxSlots[8]

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
