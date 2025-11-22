import { FormeMetadata, MetadataLookup } from '@pkm-rs/pkg'
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { NationalDex } from '../../consts/NationalDex'
import { initializeWasm } from './init'

var MimeJr: FormeMetadata
var MrMimeKanto: FormeMetadata
var MrMimeGalar: FormeMetadata
var MrRime: FormeMetadata

var Vaporeon: FormeMetadata
var Sylveon: FormeMetadata

var Applin: FormeMetadata
var Hydrapple: FormeMetadata

beforeAll(initializeWasm)
beforeAll(() => {
  function mustLookupForme(nationalDex: number, formeIndex: number) {
    const metadata = MetadataLookup(nationalDex, formeIndex)
    assert(metadata !== undefined)
    return metadata
  }

  function mustLookupBaseForme(nationalDex: number) {
    return mustLookupForme(nationalDex, 0)
  }

  MimeJr = mustLookupBaseForme(NationalDex.MimeJr)
  MrMimeKanto = mustLookupBaseForme(NationalDex.MrMime)
  MrMimeGalar = mustLookupForme(NationalDex.MrMime, 1)
  MrRime = mustLookupBaseForme(NationalDex.MrRime)

  Vaporeon = mustLookupBaseForme(NationalDex.Vaporeon)
  Sylveon = mustLookupBaseForme(NationalDex.Sylveon)

  Applin = mustLookupBaseForme(NationalDex.Applin)
  Hydrapple = mustLookupBaseForme(NationalDex.Hydrapple)
})

describe('validate expected evolution relationships', () => {
  test('mr rime is evo of mime jr', () => {
    expect(MrRime.isEvolutionOf(MimeJr))
  })

  test('mr rime is evo of galarian mr mime', () => {
    expect(MrRime.isEvolutionOf(MrMimeGalar))
  })

  test('mr rime is NOT evo of kantonian mr mime', () => {
    expect(!MrRime.isEvolutionOf(MrMimeKanto))
  })

  test('mr rime is NOT evo of mr rime', () => {
    expect(!MrRime.isEvolutionOf(MrRime))
  })

  test('vaporeon is NOT evo of sylveon', () => {
    expect(!Vaporeon.isEvolutionOf(Sylveon))
  })

  test('hydrapple is evo of applin', () => {
    expect(!Hydrapple.isEvolutionOf(Applin))
  })
})
