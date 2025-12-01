import { MetadataLookup } from '@pkm-rs/pkg'
import { BLOOD_MOON, SWEETS } from 'src/consts/Formes'
import { NationalDex } from 'src/consts/NationalDex'
import { toGen3RRPokemonIndex } from 'src/types/SAVTypes/radicalred/conversion/Gen3RRPokemonIndex'
import { RRSprites } from 'src/types/SAVTypes/radicalred/conversion/RadicalRedSprites'
import { MonSpriteData } from '../state/plugin'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '../types/pkm/util'
import { toGen3CRFUPokemonIndex } from '../types/SAVTypes/cfru/conversion/util'
import { NationalDexToUnboundMap } from '../types/SAVTypes/unbound/conversion/UnboundSpeciesMap'
import { UBSprites } from '../types/SAVTypes/unbound/conversion/UnboundSprites'

export const fileToSpriteFolder: Record<string, string> = {
  PK1: 'gen1',
  PK2: 'gen2',
  PK3: 'gen3',
  COLOPKM: 'gen3gc',
  XDPKM: 'gen3gc',
  PK3RR: 'rr',
  PK3UB: 'rr',
  PK4: 'gen4',
  PK5: 'home',
  PK6: 'home',
  PK7: 'home',
  PB7: 'home',
  PK8: 'home',
  PA8: 'home',
  PB8: 'home',
  PK9: 'gen9',
  OHPKM: 'home',
  OhpkmV1: 'home',
}

export const getPokemonSpritePath = (mon: MonSpriteData, format?: string) => {
  const monFormat = format ?? mon.format
  let formeNum = mon.formeNum

  if (isMegaStone(mon.heldItemIndex)) {
    const megaForStone = MetadataLookup(mon.dexNum, mon.formeNum)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === mon.heldItemIndex
    )

    if (megaForStone) formeNum = megaForStone.megaForme.formeIndex
  } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    formeNum = displayIndexAdder(mon.heldItemIndex)(mon.formeNum)
  }

  const formeMetadata = MetadataLookup(mon.dexNum, mon.formeNum)
  let spriteName = formeMetadata?.sprite ?? ''

  if (mon.dexNum === NationalDex.Alcremie) {
    spriteName = `${
      formeMetadata?.formeName?.toLowerCase() ?? 'alcremie-vanilla-cream'
    }-${SWEETS[mon.formArgument ?? 0].toLocaleLowerCase()}`
  }
  let spriteFolder = fileToSpriteFolder[monFormat]

  if (monFormat === 'PK3RR') {
    if (mon.dexNum === NationalDex.Ursaluna && formeNum === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    if (mon.dexNum === NationalDex.Terapagos) {
      return 'sprites/home/terapagos-terastal.png'
    }
    let gen3RRname = RRSprites[toGen3RRPokemonIndex(mon.dexNum, formeNum)]

    if (!gen3RRname) {
      console.error(`missing Radical Red sprite for ${spriteName}`)
      return `sprites/home/${spriteName}.png`
    }

    if (gen3RRname.length === 0) return gen3RRname
    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3RRname}`
  } else if (monFormat === 'PK3UB') {
    if (mon.dexNum === NationalDex.Ursaluna && formeNum === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    let gen3UBname =
      UBSprites[toGen3CRFUPokemonIndex(mon.dexNum, formeNum, NationalDexToUnboundMap)]

    if (!gen3UBname) {
      console.error(`missing Unbound sprite for ${spriteName}`)
      return `sprites/home/${spriteName}.png`
    }

    if (gen3UBname.length === 0) return gen3UBname
    gen3UBname = gen3UBname[0].toUpperCase() + gen3UBname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3UBname}`
  }
  return `sprites/${spriteFolder}${
    mon.isShiny && spriteFolder !== 'gen1' && spriteFolder !== 'gen9' ? '/shiny/' : '/'
  }${spriteName}.${spriteFolder === 'gen3gc' ? 'gif' : 'png'}`
}
