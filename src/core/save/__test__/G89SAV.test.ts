import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Ball, OriginGame } from '@pkm-rs/pkg'
import { PA8, PK4, PK8 } from '@pokemon-files/pkm'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { beforeAll, describe, expect, test } from 'vitest'
import { EmptyTracker } from '../../../tracker'
import { PKMInterface } from '../../pkm/interfaces'
import { SCBoolBlock, SCObjectBlock, writeSCBlock } from '../encryption/SwishCrypto/SCBlock'
import { SwishCrypto } from '../encryption/SwishCrypto/SwishCrypto'
import { LASAV } from '../Gen89/LASAV'
import { SwShSAV } from '../Gen89/SwShSAV'
import { PathData } from '../util/path'
import { initializeWasm } from './init'
import { dummyTrack } from './util'

beforeAll(initializeWasm)

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
  let swordSave: SwShSAV
  let arceusSave: LASAV
  let magmortar: PK4

  beforeAll(() => {
    let savePath = resolve(__dirname, 'save-files/sword')

    saveBytes = new Uint8Array(readFileSync(savePath))

    swordSave = new SwShSAV(swordPath, saveBytes, EmptyTracker())

    savePath = resolve(__dirname, 'save-files/legendsarceus')

    saveBytes = new Uint8Array(readFileSync(savePath))

    arceusSave = new LASAV(arceusPath, saveBytes, EmptyTracker())

    const monPath = resolve('src/core/pkm/__test__/PKMFiles/Gen4/magmortar.pkm')
    const monBytes = new Uint8Array(readFileSync(monPath))

    magmortar = new PK4(monBytes.buffer)
  })

  test('sword/shield hash matches', () => {
    const storedHash = saveBytes.slice(-SwishCrypto.SIZE_HASH)
    const dataBeforeHash = saveBytes.slice(0, -SwishCrypto.SIZE_HASH)
    const computedHash = SwishCrypto.computeHash(dataBeforeHash)

    expect(toHexString(storedHash)).toEqual(toHexString(computedHash))
  })

  test('SwishCrypto hash matches', () => {
    const valid = SwishCrypto.getIsHashValid(saveBytes)

    expect(valid)
  })

  test('sword data is correct', () => {
    expect(swordSave.origin).toBe(OriginGame.Sword)
    expect(swordSave.currentPCBox).toBe(15)
    expect(swordSave.boxes[17].name).toBe('huevos sorpresa')

    const flapple = swordSave.boxes[1].boxSlots[3]?.data

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
      type: 0x57,
    }

    const buffer = new Uint8Array(60)

    let offset = 0

    offset = writeSCBlock(block, buffer, offset)
    expect(offset).toBe(17)

    const block2: SCObjectBlock = {
      blockType: 'object',
      raw: new Uint8Array([5, 7, 5]).buffer,
      key: 0xefe00efe,
      type: 0x69,
    }

    offset = writeSCBlock(block2, buffer, offset)
    expect(offset).toBe(29)

    const block3: SCBoolBlock = {
      blockType: 'bool',
      key: 0xefe00efe,
      type: 1,
    }

    offset = writeSCBlock(block3, buffer, offset)
    expect(offset).toBe(34)
  })

  test('reencrypt sword/shield', () => {
    const reencrypted = SwishCrypto.encrypt(swordSave.scBlocks, swordSave.bytes.length)

    expect(SwishCrypto.getIsHashValid(reencrypted)).toBe(true)
    const decrypted = new SwShSAV(swordPath, reencrypted, EmptyTracker())

    expect(decrypted.name).toBe(swordSave.name)

    const flapple = decrypted.boxes[1].boxSlots[3]?.data

    expect(flapple?.nickname).toBe('Flapple')
    expect(flapple?.canGigantamax).toBe(true)
    expect(flapple?.ball).toBe(Ball.Premier)
    expect(flapple?.getLevel()).toBe(100)

    const mon = swordSave.boxes[1].boxSlots[3]?.data

    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = new OHPKM(mon)

    ohpkm.nickname = 'NEW NAME'
    swordSave.boxes[1].boxSlots[3] = trackedPk8(ohpkm)
    swordSave.updatedBoxSlots.push({ box: 1, index: 3 })

    swordSave.prepareForSaving()
    const modified = new SwShSAV(swordPath, swordSave.bytes, EmptyTracker())
    const modifiedFlapple = modified.boxes[1].boxSlots[3]?.data

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
  })

  test('sword save boxes', () => {
    const mon = swordSave.boxes[1].boxSlots[3]

    if (!mon) {
      throw new Error('Expected mon not found')
    }

    const ohpkm = new OHPKM(mon.data)

    ohpkm.nickname = 'NEW NAME'
    swordSave.boxes[1].boxSlots[3] = trackedPk8(ohpkm)
    swordSave.updatedBoxSlots.push({ box: 1, index: 3 })

    swordSave.prepareForSaving()
    const modified = new SwShSAV(swordPath, swordSave.bytes, EmptyTracker())
    const modifiedFlapple = modified.boxes[1].boxSlots[3]?.data

    expect(modifiedFlapple?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(swordSave.bytes)).toBe(true)
  })

  test('legends arceus save boxes', () => {
    const mon = arceusSave.boxes[13].boxSlots[1]?.data

    if (!mon) {
      throw new Error('Expected mon not found')
    }
    expect(mon.nickname).toBe('Decidueye')

    const ohpkm = new OHPKM(mon)

    ohpkm.nickname = 'NEW NAME'
    console.log('pre convert')
    arceusSave.boxes[13].boxSlots[1] = trackedPa8(ohpkm)
    console.log('post convert')
    arceusSave.updatedBoxSlots.push({ box: 13, index: 1 })

    arceusSave.boxes[2].boxSlots[8] = trackedPa8(magmortar)
    arceusSave.updatedBoxSlots.push({ box: 2, index: 8 })

    arceusSave.prepareForSaving()
    const modified = new LASAV(arceusPath, arceusSave.bytes, EmptyTracker())
    const modifiedDecidueye = modified.boxes[13].boxSlots[1]?.data

    expect(modifiedDecidueye?.nickname).toBe('NEW NAME')
    expect(SwishCrypto.getIsHashValid(arceusSave.bytes)).toBe(true)

    const modifiedMagmortar = modified.boxes[2].boxSlots[8]?.data

    expect(modifiedMagmortar?.nickname).toBe('MAGMORTAR')
  })
})

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  })
    .join('')
    .toUpperCase()
}

function trackedPk8(mon: PKMInterface) {
  return mon instanceof OHPKM ? dummyTrack(new PK8(mon)) : dummyTrack(new PK8(new OHPKM(mon)))
}

function trackedPa8(mon: PKMInterface) {
  return mon instanceof OHPKM ? dummyTrack(new PA8(mon)) : dummyTrack(new PA8(new OHPKM(mon)))
}
