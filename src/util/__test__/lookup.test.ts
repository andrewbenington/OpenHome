import { MimeJr, MrMime, MrRime, Sylveon, Vaporeon } from 'pokemon-species-data'
import { expect, test } from 'vitest'
import { getFormeData, isEvolution } from '../Lookup'

test('mr rime is evo of mime jr', () => {
  expect(
    isEvolution(
      { dexNum: MimeJr.MimeJr.nationalDex, formeNum: 0 },
      { dexNum: MrRime.MrRime.nationalDex, formeNum: 0 }
    )
  )
})

test('mr rime is evo of galarian mr mime', () => {
  expect(
    isEvolution(
      { dexNum: MrMime.MrMime.nationalDex, formeNum: 1 },
      { dexNum: MrRime.MrRime.nationalDex, formeNum: 0 }
    )
  )
})

test('mr rime is NOT evo of kantonian mr mime', () => {
  expect(
    !isEvolution(
      { dexNum: MrMime.MrMime.nationalDex, formeNum: 0 },
      { dexNum: MrRime.MrRime.nationalDex, formeNum: 0 }
    )
  )
})

test('mr rime is NOT evo of mr rime', () => {
  expect(
    !isEvolution(
      { dexNum: MrRime.MrRime.nationalDex, formeNum: 0 },
      { dexNum: MrRime.MrRime.nationalDex, formeNum: 0 }
    )
  )
})

test('vaporeon is NOT evo of sylveon', () => {
  expect(
    !isEvolution(
      { dexNum: Sylveon.Sylveon.nationalDex, formeNum: 0 },
      { dexNum: Vaporeon.Vaporeon.nationalDex, formeNum: 0 }
    )
  )
})

test('getFormeData returns undefined for invalid forme', () => {
  expect(getFormeData(Sylveon.Sylveon.nationalDex, 100)).toBeUndefined()
})
