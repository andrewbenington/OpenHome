// This file is for generating a Game Index => {NationalIndex, FormIndex} map.
// Used for the Unbound Saves.

import * as fs from 'fs'
import { PokemonData } from 'pokemon-species-data'
import { Gen3UBSpecies } from '../src/types/SAVTypes/unbound/conversion/UBPokemonIndex'

const formRegEx: RegExp = /(\w*)-(\w*)/

const normalizeName = (name: string): string => {
  const allowedTerms = ['Oh', 'M', 'F', 'Z', 'Lu', 'Pao', 'Chien', 'Yu', 'o']
  const [firstPart, secondPart] = name.split('-')

  if (secondPart && allowedTerms.includes(secondPart.trim())) {
    return `${firstPart}-${secondPart.trim().replace(/\s/g, '')}`
  } else {
    return firstPart.replace(/\s/g, '')
  }
}

const buildSpeciesDictionary = () => {
  const speciesMap = new Map<
    string,
    Array<{ Name: string; NationalDexNumber: number; FormNumber: number }>
  >()

  Object.values(PokemonData).forEach((pokemon) => {
    pokemon.formes.forEach((forme) => {
      const normalizedFormeName = normalizeName(forme.name)

      if (!speciesMap.has(normalizedFormeName)) {
        speciesMap.set(normalizedFormeName, [])
      }

      speciesMap.get(normalizedFormeName)?.push({
        Name: forme.formeName,
        NationalDexNumber: pokemon.nationalDex,
        FormNumber: forme.formeNumber,
      })
    })
  })

  return speciesMap
}

const mapUbSpeciesToDexAndForm = () => {
  const speciesMap = buildSpeciesDictionary()
  const result: Record<number, { NationalDexNumber: number; FormNumber: number } | null> = {}

  console.log(speciesMap)
  Gen3UBSpecies.forEach((speciesName, index) => {
    const normalizedSpeciesName = normalizeName(speciesName)
    const mappings = speciesMap.get(normalizedSpeciesName)

    if (mappings && mappings.length > 0) {
      const exactMatch = mappings.find((mapping) => mapping.Name === speciesName)

      if (exactMatch) {
        result[index] = {
          NationalDexNumber: exactMatch.NationalDexNumber,
          FormNumber: exactMatch.FormNumber,
        }
      } else {
        console.warn(`Exact match not found for species: ${speciesName}.`)
        result[index] = mappings[0] // Default to first form if no exact match
      }
    } else {
      console.warn(`Species not found: ${speciesName}`)
      result[index] = null
    }
  })

  return result
}

const saveResultsToFile = (
  results: Record<number, { NationalDexNumber: number; FormNumber: number } | null>
) => {
  const lines: string[] = [
    `import { GameToNationalDexEntry, makeNationalDexToGameMap } from '../../cfru/conversion/util'`,
    ``,
    `export const UnboundToNationalDexMap: Record<string, GameToNationalDexEntry | null> = {`,
  ]

  Object.entries(results).forEach(([index, mapping]) => {
    const speciesName = Gen3UBSpecies[Number(index)]
    if (mapping) {
      lines.push(
        `  \'${index}\': { NationalDexIndex: ${mapping.NationalDexNumber}, FormIndex: ${mapping.FormNumber} }, // ${speciesName}`
      )
    } else {
      lines.push(`  \'${index}\': null, // ${speciesName} (not found)`)
    }
  })

  lines.push(`}

  export const NationalDexToUnboundMap = makeNationalDexToGameMap(UnboundToNationalDexMap)
  `)

  fs.writeFileSync(
    '../../src/types/SAVTypes/unbound/conversion/UnboundSpeciesMap.ts',
    lines.join('\n'),
    'utf8'
  )
}

const speciesMapping = mapUbSpeciesToDexAndForm()
// console.log(speciesMapping)
saveResultsToFile(speciesMapping)
