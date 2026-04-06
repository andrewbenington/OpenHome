import { beforeAll, describe, expect, test } from 'vitest'
import { MemeKey, pokedexAndSaveFileMemeKey } from '../encryption/MemeKey'
import { initializeWasm } from './init'

beforeAll(initializeWasm)

describe('meme key', () => {
  test('meme key values are accurate', () => {
    const memeKey = new MemeKey(pokedexAndSaveFileMemeKey)
    expect(memeKey.getPrivateKeyU16()).toBe(
      '775455668fff3cba3026c2d0b26b8085895958341157aeb03b6b0495ee57803e2186eb6cb2eb62a71df18a3c9c6579077670961b3a6102dabe5a194ab58c3250aed597fc78978a326db1d7b28dcccb2a3e014edbd397ad33b8f28cd525054251'
    )
    expect(memeKey.getPublicKeyU16()).toBe('10001')
    expect(memeKey.getModU16()).toBe(
      'b61e192091f90a8f76a6eaaa9a3ce58c863f39ae253f037816f5975854e07a9a456601e7c94c29759fe155c064eddfa111443f81ef1a428cf6cd32f9dac9d48e94cfb3f690120e8e6b9111addaf11e7c96208c37c0143ff2bf3d7e831141a973'
    )
  })
})
