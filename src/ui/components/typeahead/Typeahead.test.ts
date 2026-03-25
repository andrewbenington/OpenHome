import { describe, expect, it } from 'vitest'
import { filterOptions } from './filter'

describe('typeahead option filtering', () => {
  const wordOptions: string[] = [
    'Apple',
    'Banana',
    'Aardvark',
    'White Grape',
    'Pineapple',
    'Red Grape',
    'lawbulletin.com',
    'Apricot',
  ]

  it('ignores case', () => {
    const filtered = filterOptions('bAnAnA', wordOptions, (opt) => opt)
    expect(filtered).toEqual(['Banana'])
  })

  it('orders start matches before others', () => {
    const filtered = filterOptions('Ap', wordOptions, (opt) => opt)
    expect(filtered).toEqual(['Apple', 'Apricot', 'White Grape', 'Pineapple', 'Red Grape'])
  })

  it('matches multiple words in option', () => {
    const filtered = filterOptions('Grape', wordOptions, (opt) => opt)
    expect(filtered).toEqual(['White Grape', 'Red Grape'])
  })

  it('treats non-alphanumeric characters as spaces', () => {
    const filtered = filterOptions('com', wordOptions, (opt) => opt)
    expect(filtered).toEqual(['lawbulletin.com'])
  })

  const abbrOptions = ['R.T.', 'R.R.T.']

  it('handles options with only non-alphanumeric characters', () => {
    const filtered = filterOptions('RT', abbrOptions, (opt) => opt)
    expect(filtered).toEqual(['R.T.', 'R.R.T.'])
  })
})
