import { getPublicImageURL } from '@openhome-ui/images/images'
import { getSpriteName } from '@openhome-ui/images/pokemon'
import { MonSpriteData } from '@openhome-ui/state/plugin'
import { LGE_STARTER, SPIKY_EAR } from '../../../packages/pokemon-resources/src/consts/Formes'
import { NationalDex } from '../../../packages/pokemon-resources/src/consts/NationalDex'
import useMonSprite from './useMonSprite'

export const FormsUsingImages: Map<number, number[]> = new Map([
  [NationalDex.Eevee, [LGE_STARTER]], // Starter Eevee
  [NationalDex.Pichu, [SPIKY_EAR]], // Spiky-eared Pichu
])

type MonSpriteResult =
  | { loading: true; path?: undefined; errorMessage?: undefined; severity?: undefined }
  | { loading: false; path?: undefined; errorMessage: string; severity: 'error' | 'warning' }
  | { loading: false; path: string; errorMessage?: string; severity?: 'error' | 'warning' }

export default function useBoxIconImage(mon: MonSpriteData): MonSpriteResult {
  const monSprite = useMonSprite(mon)
  const boxIconOverride = FormsUsingImages.get(mon.dexNum)?.includes(mon.formeNum)
  if (boxIconOverride) {
    return {
      loading: false,
      path: getPublicImageURL(`icons/box/${getSpriteName(mon)}.webp`),
    }
  }

  return monSprite
}
