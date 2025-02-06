import { readFileSync } from 'fs'
import { resolve } from 'path'
import { utf16BytesToString } from 'pokemon-files'
import { GameOfOriginData } from 'pokemon-resources'
import { SwishCrypto } from '../../../util/SwishCrypto/SwishCrypto'
import { LASAV } from '../Gen8/LASAV'
import { SwShSAV } from '../Gen8/SwShSAV'
import { PathData } from '../path'

describe('gen 8 save files', () => {
  let saveBytes: Uint8Array

  beforeAll(() => {
    let savePath = resolve(__dirname, './SAVFILES/sword')

    saveBytes = new Uint8Array(readFileSync(savePath))

    let parsedPath: PathData = {
      raw: './SAVFILES/sword',
      name: 'sword',
      dir: './SAVFILES',
      ext: '',
      separator: '/',
    }

    const swordSave = new SwShSAV(parsedPath, saveBytes)
    console.log(swordSave.trainerBlock.getName())
    console.log(GameOfOriginData[swordSave.trainerBlock.getGame()])
    console.log(swordSave.currentPCBox)

    savePath = resolve(__dirname, './SAVFILES/legendsarceus')

    saveBytes = new Uint8Array(readFileSync(savePath))

    parsedPath = {
      raw: './SAVFILES/legendsarceus',
      name: 'legendsarceus',
      dir: './SAVFILES',
      ext: '',
      separator: '/',
    }

    const arceusSave = new LASAV(parsedPath, saveBytes)
    console.log(arceusSave.name)
    console.log(arceusSave.currentPCBox)
  })

  test('SwishCrypto hash matches', () => {
    const storedHash = saveBytes.slice(-SwishCrypto.SIZE_HASH)
    const dataBeforeHash = saveBytes.slice(0, -SwishCrypto.SIZE_HASH)
    const computedHash = SwishCrypto.computeHash(dataBeforeHash)
    expect(toHexString(storedHash)).toEqual(toHexString(computedHash))
  })

  test('SwishCrypto hash matches', () => {
    const valid = SwishCrypto.getIsHashValid(saveBytes)
    expect(valid)
  })

  test('crypt xor hash matches', () => {
    const dataBeforeXor = saveBytes.slice(0, -SwishCrypto.SIZE_HASH)
    logHashes({ dataBeforeXor })
    const dataAfterXor = SwishCrypto.cryptStaticXorpadBytes(dataBeforeXor)
    logHashes({ dataAfterXor })
    expect(dataAfterXor)
    const blocks = SwishCrypto.readBlocks(dataAfterXor)
    const trainerBlock = blocks.find((b) => b.key === 0x874da6fa)
    console.log(trainerBlock)
    if (trainerBlock?.raw) {
      console.log(utf16BytesToString(trainerBlock.raw, 0, 24))
    }
  })
})

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  })
    .join('')
    .toUpperCase()
}

function logHashes(data: Record<string, Uint8Array>) {
  for (const [name, bytes] of Object.entries(data)) {
    let hex = toHexString(bytes)
    if (hex.length > 64) {
      hex = hex.slice(0, 32) + '...' + hex.slice(-32)
    }
    console.log(`${name}: ${hex} (${bytes.length})`)
  }
}
