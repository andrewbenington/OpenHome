import { SWEETS } from '@openhome-core/resources/consts/Forms'
import { $R } from '@openhome-core/util/functional'
import { boxIconImagePath } from '@openhome-ui/pokemon-details/useBoxIconImage'
import { MonSpriteData } from '@openhome-ui/state/plugin/reducer'
import { all_species_data, NationalDex, SpeciesLookup } from '@pkm-rs/pkg/pkm_rs'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { assert, describe, expect, test } from 'vitest'
import { getPokemonSpritePath } from './pokemon'

const projectRoot = process.cwd()

type SpeciesForm = { nationalDex: number; formIndex: number }
type MonSpriteDataOptions = Partial<Omit<MonSpriteData, 'nationalDex' | 'formIndex'>>

function forAllSpeciesAndForms(callback: (speciesForm: SpeciesForm) => void) {
  const allFormData = all_species_data()
  allFormData.forEach((species) =>
    species.forms.forEach((form) =>
      callback({ nationalDex: species.nationalDex, formIndex: form.formIndex })
    )
  )
}

test('all box icons are present', () => {
  const projectRoot = process.cwd()
  const missingSprites: string[] = []

  forAllSpeciesAndForms(({ nationalDex, formIndex }) => {
    const spriteResult = boxIconImagePath(
      { nationalDex, formIndex, format: 'OHPKM', extraFormIndex: undefined },
      'default'
    )

    const relativePath = $R(spriteResult).assert()
    const absolutePath = resolve(projectRoot, 'public', relativePath)

    if (!existsSync(absolutePath)) {
      missingSprites.push(absolutePath)
    }
  })

  expect(missingSprites).toStrictEqual([])
})

function homeSpriteAbsolutePath(
  nationalDex: number,
  formIndex: number,
  options?: MonSpriteDataOptions
): string {
  const spritePath = getPokemonSpritePath({
    ...options,
    nationalDex,
    formIndex,
    format: 'OHPKM',
    extraFormIndex: undefined,
  })
  return resolve(projectRoot, 'public', spritePath)
}

// the cartesian product of (non) shiny/female sprite variants. used to test for
// the presence of all sprites
const SPRITE_VARIANTS: MonSpriteDataOptions[] = [false, true].flatMap((isShiny) =>
  [false, true].map((isFemale) => ({ isShiny, isFemale }))
)

describe('all home sprites are present', () => {
  test('all home sprites are present (non-Alcremie)', () => {
    const missingSprites: string[] = []

    forAllSpeciesAndForms(({ nationalDex, formIndex }) => {
      SPRITE_VARIANTS.forEach((variantOptions) => {
        const absoluteSpritePath = homeSpriteAbsolutePath(nationalDex, formIndex, variantOptions)

        if (!existsSync(absoluteSpritePath)) {
          missingSprites.push(absoluteSpritePath)
        }
      })
    })

    expect(missingSprites).toStrictEqual([])
  })

  test('all home sprites are present for Alcremie sweets', () => {
    const missingSprites: string[] = []

    const alcremieSpecies = SpeciesLookup(NationalDex.Alcremie)
    assert(alcremieSpecies !== undefined)

    for (let form of alcremieSpecies.forms) {
      for (const sweet of Object.values(SWEETS).filter((s) => typeof s !== 'string')) {
        for (const variant of SPRITE_VARIANTS) {
          const absoluteSpritePath = homeSpriteAbsolutePath(
            alcremieSpecies.nationalDex,
            form.formIndex,
            { ...variant, formArgument: sweet }
          )
          if (!existsSync(absoluteSpritePath)) {
            missingSprites.push(absoluteSpritePath)
          }
        }
      }
    }

    expect(missingSprites).toStrictEqual([])
  })
})
