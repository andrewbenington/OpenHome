import { ETERNAL_FLOWER, LGE_STARTER, SPIKY_EAR } from '@openhome-core/resources/consts/Forms'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { R, Result } from '@openhome-core/util/functional'
import { getPokemonSpritePath, getSpriteName } from '@openhome-ui/images/pokemon'
import { MonSpriteData } from '@openhome-ui/state/plugin/reducer'
import { ExtraFormIndex, extraFormSpriteName, MetadataSummaryLookup } from '@pkm-rs/pkg'

export const FormsUsingImages: Map<number, number[]> = new Map([
  [NationalDex.Eevee, [LGE_STARTER]], // Starter Eevee
  [NationalDex.Pichu, [SPIKY_EAR]], // Spiky-eared Pichu
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

  const metadata = MetadataSummaryLookup(mon.dexNum, mon.formNum)
  if (!metadata) {
    return R.Err(`invalid species data: ndex ${mon.dexNum}/form ${mon.formNum}`)
  }

  const { formeName, sprite } = metadata

  if (
    !isRestricted(CHAMPS_TRANSFER_RESTRICTIONS, mon.dexNum, mon.formNum) &&
    !formeName?.endsWith(' Z') &&
    !formeName?.startsWith('Mega Raichu') &&
    !formeName?.includes('Battle Bond') &&
    (mon.dexNum !== NationalDex.Floette || mon.formNum >= ETERNAL_FLOWER)
  ) {
    const female = mon.isFemale ? '-f' : ''
    return R.Ok(`sprites/box/${shinyFolder}${sprite}${female}.webp`)
  }

  const boxIconOverride = FormsUsingImages.get(mon.dexNum)?.includes(mon.formNum)
  if (boxIconOverride) {
    return R.Ok(`icons/box/${getSpriteName(mon)}.webp`)
  }

  return R.Ok(getPokemonSpritePath(mon))
}
