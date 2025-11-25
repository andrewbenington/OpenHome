import { Moves } from '@pokemon-resources/index'
import { writeFileSync } from 'fs'
import { Gen3RRMoves } from '../../src/types/SAVTypes/radicalred/conversion/Gen3RRMovesIndex'

const NationalMoves = Moves

function generateMappings(rrMoves: string[], nationalMoves: Record<string, any>) {
  const rrToNationalMap: Record<string, number> = {}
  const nationalToRRMap: Record<string, number[]> = {}

  rrMoves.forEach((rrMoveName, rrIndex) => {
    let matchedId = -1

    for (const nationalMove of Object.values(nationalMoves)) {
      if (nationalMove.name === rrMoveName) {
        matchedId = nationalMove.id
        break
      }
    }

    rrToNationalMap[rrMoveName] = matchedId

    if (matchedId !== -1) {
      if (!nationalToRRMap[rrMoveName]) {
        nationalToRRMap[rrMoveName] = []
      }
      nationalToRRMap[rrMoveName].push(rrIndex)
    }
  })

  return { rrToNationalMap, nationalToRRMap }
}

const { rrToNationalMap, nationalToRRMap } = generateMappings(Gen3RRMoves, NationalMoves)

writeFileSync('rrToNationalMap.json', JSON.stringify(rrToNationalMap, null, 2))
writeFileSync('nationalToRRMap.json', JSON.stringify(nationalToRRMap, null, 2))

console.log('Mapping files created successfully!')
