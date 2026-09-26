import { isRomHackFormat } from '@openhome-core/pkm/interfaces'
import {
  displayIndexAdder,
  isBattleFormeItem,
  isMegaStone,
  PkmOrOhpkmFormat,
} from '@openhome-core/pkm/util'
import { hasGenderDifference } from '@openhome-core/pkm/util/index'
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

export type PokemonImageSource = {
  directory: string
  extension: string
  notGendered: boolean
  noShiny: boolean
}

function ImageSource(
  directory: string,
  extension: string,
  options: { notGendered: boolean; noShiny: boolean }
): PokemonImageSource {
  return { directory, extension, ...options }
}

function PngSource(
  directory: string,
  options?: { notGendered?: boolean; noShiny?: boolean }
): PokemonImageSource {
  return ImageSource(directory, 'png', { notGendered: false, noShiny: false, ...options })
}

function GifSource(
  directory: string,
  options?: { notGendered?: boolean; noShiny?: boolean }
): PokemonImageSource {
  return ImageSource(directory, 'gif', { notGendered: false, noShiny: false, ...options })
}

function WebpSource(
  directory: string,
  options?: { notGendered?: boolean; noShiny?: boolean }
): PokemonImageSource {
  return ImageSource(directory, 'webp', { notGendered: false, noShiny: false, ...options })
}

const Gen1Sprites = PngSource('gen1', { notGendered: true, noShiny: true })
const Gen2Sprites = PngSource('gen2', { notGendered: true })
const Gen3Sprites = PngSource('gen3', { notGendered: true })
const XdAnimatedSprites = GifSource('gen3gc', { notGendered: true })
const Gen4Sprites = PngSource('gen4')
const Gen9Sprites = PngSource('gen9', { noShiny: true })
const RadicalRedSprites = PngSource('rr', { notGendered: true })
const HomeSprites = WebpSource('home')
export const HomeBoxSprites = WebpSource('box-home', { noShiny: true })
export const ChampionsBoxSprites = WebpSource('box-champions')

function getImageSource(format: PkmOrOhpkmFormat): PokemonImageSource {
  switch (format) {
    case 'PK1':
      return Gen1Sprites
    case 'PK2':
      return Gen2Sprites
    case 'PK3':
      return Gen3Sprites
    case 'COLOPKM':
    case 'XDPKM':
      return XdAnimatedSprites
    case 'PK3RR':
    case 'PK3UB':
      return RadicalRedSprites
    case 'PK4':
      return Gen4Sprites
    case 'PK9':
    case 'PK9Compass':
      return Gen9Sprites
    case 'PK5':
    case 'PK6':
    case 'PK7':
    case 'PB7':
    case 'PK8':
    case 'PA8':
    case 'PB8':
    case 'PB8LUMI':
    case 'PA9':
    case 'OHPKM':
      return HomeSprites
  }
}

export const getPokemonSpritePath = (mon: MonSpriteData, format?: PkmOrOhpkmFormat) => {
  const monFormat: PkmOrOhpkmFormat = format ?? mon.format
  return getPokemonSpritePathInner(mon, getImageSource(monFormat), monFormat)
}

export const getPokemonSpritePathInner = (
  mon: MonSpriteData,
  spriteSource: PokemonImageSource,
  monFormat?: string
) => {
  if (isMegaStone(mon.heldItemIndex)) {
    const megaForStone = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === mon.heldItemIndex
    )

    if (megaForStone) mon.formIndex = megaForStone.megaForme.formIndex
  } else if (isBattleFormeItem(mon.nationalDex, mon.heldItemIndex)) {
    mon.formIndex = displayIndexAdder(mon.heldItemIndex)(mon.formIndex)
  }

  if (monFormat && isRomHackFormat(monFormat)) {
    const romHackSprite = getRomHackSpritePath(mon)
    if (romHackSprite) return romHackSprite
  }

  const alwaysUsedSprite = getAlwaysUsedSpritePath(
    mon.nationalDex,
    mon.formIndex,
    mon.extraFormIndex
  )
  if (alwaysUsedSprite) return alwaysUsedSprite

  const extraFormSprite = mon.extraFormIndex ? extraFormSpriteName(mon.extraFormIndex) : undefined
  if (extraFormSprite) {
    return `sprites/extra/${extraFormSprite}.webp`
  }
  let spriteName = getSpriteName(mon, monFormat)
  if (!spriteSource.notGendered && hasGenderDifference(mon.nationalDex) && mon.isFemale) {
    spriteName += '-f'
  }

  const spriteDirectory =
    mon.isShiny && !spriteSource.noShiny
      ? `${spriteSource.directory}/shiny`
      : spriteSource.directory

  if (!spriteDirectory) {
    throw Error(`MISSING: ${spriteSource}`)
  }

  return `sprites/${spriteDirectory}/${spriteName}.${spriteSource.extension}`
}

export function getSpriteName(mon: MonSpriteData, format?: string): string {
  const formeMetadata = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)
  if (!formeMetadata) return ''
  let spriteName = formeMetadata?.sprite ?? ''

  if (mon.nationalDex === NationalDex.Alcremie) {
    if (format === 'PK9' || format === 'PK9Compass') return spriteName
    spriteName = `${spriteName}-${SWEETS[mon.formArgument ?? 0].toLocaleLowerCase()}`
  }
  return spriteName
}

function getRomHackSpritePath(mon: MonSpriteData) {
  const spriteName = getSpriteName(mon, mon.format)
  const monFormat = mon.format
  let spriteFolder = getImageSource(mon.format).directory

  if (monFormat === 'PK3RR') {
    if (mon.nationalDex === NationalDex.Ursaluna && mon.formIndex === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    if (mon.nationalDex === NationalDex.Terapagos) {
      return 'sprites/home/terapagos-terastal.png'
    }

    const radicalRedIndex = toRadicalRedPokemonIndex(
      mon.nationalDex,
      mon.formIndex,
      mon.extraFormIndex
    )
    let gen3RRname = radicalRedIndex !== undefined ? RRSprites[radicalRedIndex] : undefined

    if (!gen3RRname) {
      console.error(`missing Radical Red sprite for ${spriteName}`)
      return `sprites/home/${spriteName}.png`
    }

    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/${spriteFolder}/${gen3RRname}`
  } else if (monFormat === 'PK3UB') {
    if (mon.nationalDex === NationalDex.Ursaluna && mon.formIndex === BLOOD_MOON) {
      return 'sprites/home/ursaluna-bloodmoon.png'
    }
    let gen3UBname =
      UBSprites[toGen3UBPokemonIndex(mon.nationalDex, mon.formIndex, mon.extraFormIndex)]

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

    const lumiForm = getLumiFormIndexByExtraFormIndex(mon.nationalDex, mon.extraFormIndex)
    if (lumiForm === undefined) {
      return
    }

    return `sprites/lumi/${mon.nationalDex}-${lumiForm}.webp`
  }
  const extension = spriteFolder === 'gen3gc' ? 'gif' : spriteFolder === 'home' ? 'webp' : 'png'
  return `sprites/${spriteFolder}${
    mon.isShiny && spriteFolder !== 'gen1' && spriteFolder !== 'gen9' ? '/shiny/' : '/'
  }${spriteName}.${extension}`
}

const getAlwaysUsedSpritePath = (
  nationalDex: number,
  formIndex?: number,
  extraFormIndex?: ExtraFormIndex
) => {
  if (
    extraFormIndex &&
    isSeviiForm(extraFormIndex) &&
    extraFormIndex !== ExtraFormIndex.MantykeSevii
  ) {
    const radicalRedIndex = toRadicalRedPokemonIndex(nationalDex, formIndex ?? 0, extraFormIndex)
    let gen3RRname = radicalRedIndex !== undefined ? RRSprites[radicalRedIndex] : undefined

    if (!gen3RRname) return undefined

    gen3RRname = gen3RRname[0].toUpperCase() + gen3RRname.slice(1).toLowerCase()
    return `sprites/rr/${gen3RRname}`
  }
  if (nationalDex === NationalDex.Eevee && formIndex === 1) {
    return 'sprites/home/eevee-starter.png'
  }
}
