import { readFileSync } from 'fs'
import { resolve } from 'path'
import { utf16BytesToString } from 'pokemon-files'
import { SwishCrypto } from '../../../util/SwishCrypto/SwishCrypto'

describe('gen 8 save files', () => {
  // let ultraSunSave: USUMSAV
  let saveBytes: Uint8Array

  beforeAll(() => {
    const savePath = resolve(__dirname, './SAVFILES/sword')

    saveBytes = new Uint8Array(readFileSync(savePath))

    // const parsedPath: PathData = {
    //   raw: './SAVFILES/ultrasun',
    //   name: 'ultrasun',
    //   dir: './SAVFILES',
    //   ext: '',
    //   separator: '/',
    // }

    // ultraSunSave = new USUMSAV(parsedPath, saveBytes)
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
      console.log(utf16BytesToString(trainerBlock.raw.buffer as ArrayBuffer, 0, 24))
    }
    // const toLog: Record<string, Uint8Array> = {}

    // blocks.forEach((block, i) => {
    //   if (block.raw) {
    //     toLog[`block${i + 1}`] = block.raw
    //   }
    // })
    // logHashes(toLog)
  })
  // test('first mon is as expected', () => {
  //   expect(ultraSunSave.boxes[0].pokemon[0]?.nickname === 'Bulbasaur')
  // })
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
