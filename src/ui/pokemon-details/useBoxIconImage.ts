import { nationalDexHasGenderDifference } from '@openhome-core/pkm/util/index'
import { ETERNAL_FLOWER, LGE_STARTER, SPIKY_EAR } from '@openhome-core/resources//consts/Forms'
import { NationalDex } from '@openhome-core/resources//consts/NationalDex'
import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { R, Result } from '@openhome-core/util/functional'
import { getPokemonSpritePathInner, getSpriteName } from '@openhome-ui/images/pokemon'
import { MonSpriteData } from '@openhome-ui/state/plugin/reducer'
import { ExtraFormIndex, extraFormSpriteName, MetadataSummaryLookup } from '@pkm-rs/pkg'

export const FormsUsingImages: Map<number, number[]> = new Map([
  [NationalDex.Eevee, [LGE_STARTER]], // Starter Eevee
  [NationalDex.Pichu, [SPIKY_EAR]], // Spiky-eared Pichu
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

export function boxIconImagePath(mon: MonSpriteData): Result<string, string> {
  const shinyFolder = mon.isShiny ? 'shiny/' : ''
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
    !formeName?.startsWith('Mega Raichu') &&
    !formeName?.includes('Battle Bond') &&
    (mon.nationalDex !== NationalDex.Floette || mon.formIndex >= ETERNAL_FLOWER)
  ) {
    const female =
      mon.isFemale &&
      nationalDexHasGenderDifference(mon.nationalDex) &&
      mon.formIndex === 0 &&
      !mon.extraFormIndex
        ? '-f'
        : ''

    return R.Ok(`sprites/box-champions/${shinyFolder}${sprite}${female}.webp`)
  }

  const boxIconOverride = FormsUsingImages.get(mon.nationalDex)?.includes(mon.formIndex)
  if (boxIconOverride) {
    return R.Ok(`icons/box/${getSpriteName(mon)}.webp`)
  }

  return R.Ok(getPokemonSpritePathInner(mon, 'box-home', 'webp'))
}
