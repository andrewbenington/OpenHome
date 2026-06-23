import { R } from '@openhome-core/util/functional'
import { boxIconImagePath } from '@openhome-ui/pokemon-details/useBoxIconImage'
import { all_species_data } from '@pkm-rs/pkg/pkm_rs'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { expect, test } from 'vitest'
import { iconType } from './images'

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

// test('all home sprites are present', () => {
//   const allFormData = all_species_data()
//   const projectRoot = process.cwd()

//   const missingSprites: string[] = []

//   for (let species of allFormData) {
//     for (let form of species.forms.filter(
//       (f) => iconType(species.nationalDex, f.formIndex, undefined) === 'image'
//     )) {
//       const spritePath = getPokemonSpritePath({
//         dexNum: species.nationalDex,
//         formNum: form.formIndex,
//         format: 'OHPKM',
//         extraFormIndex: undefined,
//       })
//       const absolutePath = resolve(projectRoot, 'public', spritePath)
//       if (!existsSync(absolutePath)) {
//         missingSprites.push(spritePath)
//       }
//     }
//   }

//   expect(missingSprites).toStrictEqual([])
// })
