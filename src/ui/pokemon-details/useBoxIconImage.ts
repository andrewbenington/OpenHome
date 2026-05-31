import { getPublicImageURL } from '@openhome-ui/images/images'
import { getSpriteName } from '@openhome-ui/images/pokemon'
import { ExtraFormIndex, extraFormSpriteName, MetadataSummaryLookup } from '@pkm-rs/pkg'
import { CHAMPS_TRANSFER_RESTRICTIONS } from '@pokemon-resources/consts/TransferRestrictions'
import { isRestricted } from 'src/core/save/util/TransferRestrictions'
import { MonSpriteData } from 'src/ui/state/plugin/reducer'
import {
  ETERNAL_FLOWER,
  LGE_STARTER,
  SPIKY_EAR,
} from '../../../packages/pokemon-resources/src/consts/Forms'
import { NationalDex } from '../../../packages/pokemon-resources/src/consts/NationalDex'
import useMonSprite from './useMonSprite'

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

type MonSpriteResult =
  | { loading: true; path?: undefined; errorMessage?: undefined; severity?: undefined }
  | { loading: false; path?: undefined; errorMessage: string; severity: 'error' | 'warning' }
  | { loading: false; path?: string; errorMessage?: string; severity?: 'error' | 'warning' }

export default function useBoxIconImage(mon: MonSpriteData): MonSpriteResult {
  const monSprite = useMonSprite(mon)

  const shinyFolder = mon.isShiny ? 'shiny/' : ''
  if (mon.extraFormIndex && ExtraFormsUsingImages.has(mon.extraFormIndex)) {
    const extraFormSprite = extraFormSpriteName(mon.extraFormIndex)
    return {
      loading: false,
      path: getPublicImageURL(`icons/box/${extraFormSprite}.webp`),
    }
  }

  const metadata = MetadataSummaryLookup(mon.dexNum, mon.formNum)
  if (!metadata) {
    return {
      loading: false,
      errorMessage: `invalid species data: ndex ${mon.dexNum}/form ${mon.formNum}`,
      severity: 'error',
    }
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
    return {
      loading: false,
      path: getPublicImageURL(`sprites/box/${shinyFolder}${sprite}${female}.webp`),
    }
  }

  const boxIconOverride = FormsUsingImages.get(mon.dexNum)?.includes(mon.formNum)
  if (boxIconOverride) {
    return {
      loading: false,
      path: getPublicImageURL(`icons/box/${getSpriteName(mon)}.webp`),
    }
  }

  return monSprite
}
