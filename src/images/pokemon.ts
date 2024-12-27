import { NationalDex, PokemonData } from 'pokemon-species-data'

import { BLOOD_MOON, SWEETS } from 'src/consts/Formes'
import { PKMInterface } from 'src/types/interfaces'
import { toGen3RRPokemonIndex } from 'src/types/SAVTypes/radicalred/conversion/Gen3RRPokemonIndex'
import { RRSprites } from 'src/types/SAVTypes/radicalred/conversion/RadicalRedSprites'

export const fileToSpriteFolder: Record<string, string> = {
  PK1: 'gen1',
  PK2: 'gen2',
  PK3: 'gen3',
  COLOPKM: 'gen3gc',
  XDPKM: 'gen3gc',
  PK3RR: 'rr',
  PK4: 'gen4',
  PK5: 'home',
  PK6: 'gen6',
  PK7: 'home',
  PB7: 'home',
  PK8: 'home',
  PA8: 'home',
  PB8: 'home',
  PK9: 'gen9',
  OHPKM: 'home',
}

export const getPokemonSpritePath = (mon: PKMInterface, format?: string) => {
  const monFormat = format ?? mon.format
  let spriteName = PokemonData[mon.dexNum]?.formes[mon.formeNum]?.sprite ?? ''

  if (mon.dexNum === NationalDex.Alcremie) {
    spriteName = `${
      PokemonData[mon.dexNum]?.formes[mon.formeNum]?.formeName?.toLowerCase() ??
      'alcremie-vanilla-cream'
    }-${SWEETS[mon.formArgument ?? 0].toLocaleLowerCase()}`
  }
  let spriteFolder = fileToSpriteFolder[monFormat]

  if (spriteFolder === 'rr') {
    if (mon.dexNum === NationalDex.Ursaluna && mon.formeNum === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    let gen3RRname = RRSprites[toGen3RRPokemonIndex(mon.dexNum, mon.formeNum)]

    if (gen3RRname.length === 0) return gen3RRname
    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3RRname}`
  }
  return `sprites/${spriteFolder}${
    mon.isShiny() && spriteFolder !== 'gen1' && spriteFolder !== 'gen9' ? '/shiny/' : '/'
  }${spriteName}.${spriteFolder === 'gen3gc' ? 'gif' : 'png'}`
}
