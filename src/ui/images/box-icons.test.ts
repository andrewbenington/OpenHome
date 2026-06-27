import { SWEETS } from '@openhome-core/resources/consts/Forms'
import { R } from '@openhome-core/util/functional'
import { boxIconImagePath } from '@openhome-ui/pokemon-details/useBoxIconImage'
import { all_species_data, NationalDex } from '@pkm-rs/pkg/pkm_rs'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, test } from 'vitest'
import { iconType } from './images'
import { getPokemonSpritePath } from './pokemon'

test('all box icons are present', () => {
  const allFormData = all_species_data()
  const projectRoot = process.cwd()

  const missingSprites: string[] = []

  for (let species of allFormData) {
    for (let form of species.forms.filter(
      (f) => iconType(species.nationalDex, f.formIndex, undefined) === 'image'
    )) {
      const spriteResult = boxIconImagePath({
        dexNum: species.nationalDex,
        formNum: form.formIndex,
        format: 'OHPKM',
        extraFormIndex: undefined,
      })
      R.match(
        (spritePath: string) => {
          const absolutePath = resolve(projectRoot, 'public', spritePath)
          if (!existsSync(absolutePath)) {
            missingSprites.push(absolutePath)
          }
        },
        (err: string) => {
          console.error(err)
        }
      )(spriteResult)
    }
  }

  expect(missingSprites).toStrictEqual([])
})

describe('all home sprites are present', () => {
  test('all home sprites are present (non-Alcremie)', () => {
    const allFormData = all_species_data()
    const projectRoot = process.cwd()

    const missingSprites: string[] = []

    for (let species of allFormData) {
      for (let form of species.forms.filter(
        (f) => iconType(species.nationalDex, f.formIndex, undefined) === 'image'
      )) {
        const spritePath = getPokemonSpritePath({
          dexNum: species.nationalDex,
          formNum: form.formIndex,
          format: 'OHPKM',
          extraFormIndex: undefined,
        })
        const absolutePath = resolve(projectRoot, 'public', spritePath)
        if (!existsSync(absolutePath)) {
          missingSprites.push(spritePath)
        }
      }
    }

    expect(missingSprites).toStrictEqual([])
  })

  test('all home sprites are present for Alcremie sweets', () => {
    const allFormData = all_species_data()
    const projectRoot = process.cwd()

    const missingSprites: string[] = []

    const species = allFormData[NationalDex.Alcremie]

    for (let form of species.forms.filter(
      (f) => iconType(species.nationalDex, f.formIndex, undefined) === 'image'
    )) {
      for (const sweet of Object.values(SWEETS).filter((s) => typeof s !== 'string')) {
        const spritePath = getPokemonSpritePath({
          dexNum: species.nationalDex,
          formNum: form.formIndex,
          format: 'OHPKM',
          extraFormIndex: undefined,
          formArgument: sweet,
        })
        const absolutePath = resolve(projectRoot, 'public', spritePath)
        if (!existsSync(absolutePath)) {
          missingSprites.push(spritePath)
        }
      }
    }

    expect(missingSprites).toStrictEqual([])
  })
})
