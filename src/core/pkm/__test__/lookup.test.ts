import { FormMetadata, MetadataSummaryLookup } from '@pkm-rs/pkg'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'
import { assert, beforeAll, describe, expect, test } from 'vitest'
import { initializeWasm } from './init'

var MimeJr: FormMetadata
var MrMimeKanto: FormMetadata
var MrMimeGalar: FormMetadata
var MrRime: FormMetadata

var Vaporeon: FormMetadata
var Sylveon: FormMetadata

var Applin: FormMetadata
var Hydrapple: FormMetadata

beforeAll(initializeWasm)
beforeAll(() => {
  function mustLookupForm(nationalDex: number, formIndex: number) {
    const metadata = MetadataSummaryLookup(nationalDex, formIndex)
    assert(metadata !== undefined)
    return metadata
  }

  function mustLookupBaseForm(nationalDex: number) {
    return mustLookupForm(nationalDex, 0)
  }

  MimeJr = mustLookupBaseForm(NationalDex.MimeJr)
  MrMimeKanto = mustLookupBaseForm(NationalDex.MrMime)
  MrMimeGalar = mustLookupForm(NationalDex.MrMime, 1)
  MrRime = mustLookupBaseForm(NationalDex.MrRime)

  Vaporeon = mustLookupBaseForm(NationalDex.Vaporeon)
  Sylveon = mustLookupBaseForm(NationalDex.Sylveon)

  Applin = mustLookupBaseForm(NationalDex.Applin)
  Hydrapple = mustLookupBaseForm(NationalDex.Hydrapple)
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
