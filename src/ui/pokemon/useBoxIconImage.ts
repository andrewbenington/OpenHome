import { nationalDexHasGenderFormDifference } from '@openhome-core/pkm/util/index'
import { LGE_STARTER, SPIKY_EAR } from '@openhome-core/resources//consts/Forms'
import { NationalDex } from '@openhome-core/resources//consts/NationalDex'
import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { R, Result } from '@openhome-core/util/functional'
import { BoxIconSpriteType } from '@openhome-ui/hooks/monDisplay'
import {
  getPokemonSpritePathFromSource,
  getSpriteName,
  HomeBoxSprites,
  HomeSprites,
} from '@openhome-ui/images/pokemon'
import { MonSpriteData } from '@openhome-ui/state/plugin/reducer'
import { ExtraFormIndex, extraFormSpriteName, MetadataSummaryLookup } from '@pkm-rs/pkg'

export const FormsUsingImages: Map<number, number[]> = new Map([
  [NationalDex.Eevee, [LGE_STARTER]],
  [NationalDex.Pichu, [SPIKY_EAR]],

  // Megas not in Champions
  [NationalDex.Heatran, [1]],
  [NationalDex.Darkrai, [1]],
  [NationalDex.Tatsugiri, [3, 4, 5]],
  [NationalDex.Magearna, [2, 3]],
  [NationalDex.Zeraora, [1]],
])

const ExtraFormsUsingImages: Set<ExtraFormIndex> = new Set([
  ExtraFormIndex.VenusaurClone,
  ExtraFormIndex.CharizardClone,
  ExtraFormIndex.BlastoiseClone,
  ExtraFormIndex.PikachuClone,
  ExtraFormIndex.PikachuRockStar,
  ExtraFormIndex.PikachuBelle,
  ExtraFormIndex.PikachuCosplay,
  ExtraFormIndex.GengarStitched,
])

export function boxIconImagePath(
  mon: MonSpriteData,
  spriteType: BoxIconSpriteType
): Result<string, string> {
  const shinyFolder = mon.isShiny ? 'shiny/' : ''
  if (spriteType === 'home') {
    return R.Ok(getPokemonSpritePathFromSource(mon, HomeSprites))
  }

  if (mon.extraFormIndex && ExtraFormsUsingImages.has(mon.extraFormIndex)) {
    const extraFormSprite = extraFormSpriteName(mon.extraFormIndex)
    return R.Ok(`icons/box/${extraFormSprite}.webp`)
  }

  const metadata = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)
  if (!metadata) {
    return R.Err(`invalid species data: ndex ${mon.nationalDex}/form ${mon.formIndex}`)
  }

  const { formeName, sprite } = metadata

  if (
    !isRestricted(CHAMPS_TRANSFER_RESTRICTIONS, mon.nationalDex, mon.formIndex) &&
    !formeName?.includes('Battle Bond')
  ) {
    const female =
      mon.isFemale &&
      nationalDexHasGenderFormDifference(mon.nationalDex) &&
      mon.formIndex === 0 &&
      !mon.extraFormIndex
        ? '-f'
        : ''

    return R.Ok(`sprites/box-champions/${shinyFolder}${sprite}${female}.webp`)
  }

  const monWithoutGender = { ...mon, isFemale: false }

  const boxIconOverride = FormsUsingImages.get(mon.nationalDex)?.includes(mon.formIndex)
  if (boxIconOverride) {
    return R.Ok(`icons/box/${getSpriteName(monWithoutGender)}.webp`)
  }

  return R.Ok(getPokemonSpritePathFromSource(monWithoutGender, HomeBoxSprites))
}
