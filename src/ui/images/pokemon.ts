import { isRomHackFormat, MonFormat } from '@openhome-core/pkm/interfaces'
import {
  displayIndexAdder,
  isBattleFormeItem,
  isMegaStone,
  PkmOrOhpkmFormat,
} from '@openhome-core/pkm/util'
import { BLOOD_MOON, SWEETS } from '@openhome-core/resources/consts/Forms'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import { getLumiFormIndexByExtraFormIndex } from '@openhome-core/save/luminescentplatinum/conversion/LuminescentPlatinumFormMap'
import { RRSprites } from '@openhome-core/save/radicalred/conversion/RadicalRedSprites'
import { toRadicalRedPokemonIndex } from '@openhome-core/save/radicalred/conversion/species'
import { toGen3UBPokemonIndex } from '@openhome-core/save/unbound/conversion/Gen3UBPokemonIndex'
import { UBSprites } from '@openhome-core/save/unbound/conversion/UnboundSprites'
import { MonSpriteData } from '@openhome-ui/state/plugin/reducer'
import {
  ExtraFormIndex,
  extraFormSpriteName,
  isSeviiForm,
  MetadataSummaryLookup,
} from '@pkm-rs/pkg'

const fileToSpriteFolder: Record<PkmOrOhpkmFormat, string> = {
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
  PB8LUMI: 'home',
  PK9: 'gen9',
  PK9Compass: 'gen9',
  PA9: 'home',
  OHPKM: 'home',
}

export const getPokemonSpritePath = (mon: MonSpriteData, format?: string) => {
  const monFormat = format ?? mon.format

  if (isMegaStone(mon.heldItemIndex)) {
    const megaForStone = MetadataSummaryLookup(mon.dexNum, mon.formNum)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === mon.heldItemIndex
    )

    if (megaForStone) mon.formNum = megaForStone.megaForme.formIndex
  } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    mon.formNum = displayIndexAdder(mon.heldItemIndex)(mon.formNum)
  }

  let spriteFolder = fileToSpriteFolder[monFormat as MonFormat]

  if (isRomHackFormat(monFormat)) {
    const romHackSprite = getRomHackSpritePath(mon)
    if (romHackSprite) return romHackSprite
  }

  const alwaysUsedSprite = getAlwaysUsedSpritePath(mon.dexNum, mon.formNum, mon.extraFormIndex)
  if (alwaysUsedSprite) return alwaysUsedSprite

  const extraFormSprite = mon.extraFormIndex ? extraFormSpriteName(mon.extraFormIndex) : undefined

  const spriteName = extraFormSprite ?? getSpriteName(mon)

  if (extraFormSprite) {
    spriteFolder = 'extra'
  }

  const extension =
    spriteFolder === 'gen3gc'
      ? 'gif'
      : spriteFolder === 'home' || spriteFolder === 'extra'
        ? 'webp'
        : 'png'

  return `sprites/${spriteFolder}${
    mon.isShiny && spriteFolder !== 'gen1' && spriteFolder !== 'gen9' ? '/shiny/' : '/'
  }${spriteName}.${extension}`
}

export function getSpriteName(mon: MonSpriteData): string {
  const formeMetadata = MetadataSummaryLookup(mon.dexNum, mon.formNum)
  let spriteName = formeMetadata?.sprite ?? ''

  const female = mon.isFemale ? '-f' : ''
  if (mon.dexNum === NationalDex.Alcremie) {
    spriteName = `${
      formeMetadata?.formeName?.toLowerCase() ?? 'alcremie-vanilla-cream'
    }-${SWEETS[mon.formArgument ?? 0].toLocaleLowerCase()}${female}`
  }
  return spriteName
}

function getRomHackSpritePath(mon: MonSpriteData) {
  const spriteName = getSpriteName(mon)
  const monFormat = mon.format
  let spriteFolder = fileToSpriteFolder[monFormat as MonFormat]

  if (monFormat === 'PK3RR') {
    if (mon.dexNum === NationalDex.Ursaluna && mon.formNum === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    if (mon.dexNum === NationalDex.Terapagos) {
      return 'sprites/home/terapagos-terastal.png'
    }

    const radicalRedIndex = toRadicalRedPokemonIndex(mon.dexNum, mon.formNum, mon.extraFormIndex)
    let gen3RRname = radicalRedIndex !== undefined ? RRSprites[radicalRedIndex] : undefined

    if (!gen3RRname) {
      console.error(`missing Radical Red sprite for ${spriteName}`)
      return `sprites/home/${spriteName}.png`
    }

    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3RRname}`
  } else if (monFormat === 'PK3UB') {
    if (mon.dexNum === NationalDex.Ursaluna && mon.formNum === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    let gen3UBname = UBSprites[toGen3UBPokemonIndex(mon.dexNum, mon.formNum, mon.extraFormIndex)]

    if (!gen3UBname) {
      console.error(`missing Unbound sprite for ${spriteName}`)
      return `sprites/home/${spriteName}.png`
    }

    if (gen3UBname.length === 0) return gen3UBname
    gen3UBname = gen3UBname[0].toUpperCase() + gen3UBname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3UBname}`
  } else if (monFormat === 'PB8LUMI') {
    if (!mon.extraFormIndex) {
      return
    }

    const lumiForm = getLumiFormIndexByExtraFormIndex(mon.dexNum, mon.extraFormIndex)
    if (lumiForm === undefined) {
      return
    }

    return `sprites/lumi/${mon.dexNum}-${lumiForm}.webp`
  }
  const extension = spriteFolder === 'gen3gc' ? 'gif' : spriteFolder === 'home' ? 'webp' : 'png'
  return `sprites/${spriteFolder}${
    mon.isShiny && spriteFolder !== 'gen1' && spriteFolder !== 'gen9' ? '/shiny/' : '/'
  }${spriteName}.${extension}`
}

const getAlwaysUsedSpritePath = (
  dexNum: number,
  formNum?: number,
  extraFormIndex?: ExtraFormIndex
) => {
  if (
    extraFormIndex &&
    isSeviiForm(extraFormIndex) &&
    extraFormIndex !== ExtraFormIndex.MantykeSevii
  ) {
    const radicalRedIndex = toRadicalRedPokemonIndex(dexNum, formNum ?? 0, extraFormIndex)
    let gen3RRname = radicalRedIndex !== undefined ? RRSprites[radicalRedIndex] : undefined

    if (!gen3RRname) return undefined

    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/rr/${gen3RRname}`
  }
  if (dexNum === NationalDex.Eevee && formNum === 1) {
    return 'sprites/home/eevee-starter.png'
  }
}
