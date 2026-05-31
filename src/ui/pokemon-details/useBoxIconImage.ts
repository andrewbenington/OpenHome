import { getPublicImageURL } from '@openhome-ui/images/images'
import { getSpriteName } from '@openhome-ui/images/pokemon'
import { ExtraFormIndex, extraFormSpriteName, MetadataSummaryLookup } from '@pkm-rs/pkg'
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
  | { loading: false; path: string; errorMessage?: string; severity?: 'error' | 'warning' }

export const IN_CHAMPIONS = [
  3, 6, 9, 15, 18, 24, 25, 26, 36, 38, 59, 65, 68, 71, 80, 94, 115, 121, 127, 128, 130, 132, 134,
  135, 136, 142, 143, 149, 154, 157, 160, 168, 181, 184, 186, 196, 197, 199, 205, 208, 212, 214,
  227, 229, 248, 279, 282, 302, 306, 308, 310, 319, 323, 324, 334, 350, 351, 354, 358, 359, 362,
  389, 392, 395, 405, 407, 409, 411, 428, 442, 445, 448, 450, 454, 460, 461, 464, 470, 471, 472,
  473, 475, 478, 479, 497, 500, 503, 505, 510, 512, 514, 516, 530, 531, 534, 547, 553, 563, 569,
  571, 579, 584, 587, 609, 614, 618, 623, 635, 637, 652, 655, 658, 660, 663, 666, 670, 671, 675,
  676, 678, 681, 683, 685, 693, 695, 697, 699, 700, 701, 702, 706, 707, 709, 711, 713, 715, 724,
  727, 730, 733, 740, 745, 748, 750, 752, 758, 763, 765, 766, 778, 780, 784, 823, 841, 842, 844,
  855, 858, 866, 867, 869, 877, 887, 899, 900, 902, 903, 908, 911, 914, 925, 934, 936, 937, 939,
  952, 956, 959, 964, 968, 970, 981, 983, 1013, 1018, 1019,
]

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

  const formName = MetadataSummaryLookup(mon.dexNum, mon.formNum)?.formeName

  if (
    IN_CHAMPIONS.includes(mon.dexNum) &&
    !formName?.endsWith(' Z') &&
    !formName?.startsWith('Mega Raichu') &&
    !formName?.includes('Battle Bond') &&
    (mon.dexNum !== NationalDex.Floette || mon.formNum >= ETERNAL_FLOWER)
  ) {
    const female = mon.isFemale ? '-f' : ''
    console.log(MetadataSummaryLookup(mon.dexNum, mon.formNum)?.formeName)
    return {
      loading: false,
      path: getPublicImageURL(
        `sprites/box/${shinyFolder}${MetadataSummaryLookup(mon.dexNum, mon.formNum)?.sprite}${female}.webp`
      ),
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
