import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Option } from '@openhome-core/util/functional'
import { FormsUsingImages } from '@openhome-ui/pokemon-details/useBoxIconImage'
import {
  ExtraFormIndex,
  Generation,
  MetadataSummaryLookup,
  extraFormSpriteName,
} from '@pkm-rs/pkg/pkm_rs'

export const getPublicImageURL = (path: string): string => {
  return `/${path}`
}

export const getTypeIconPath = (type: string): string => {
  return `types/${type.toLowerCase()}.png`
}

export type IconType = 'spritesheet' | 'image'

export function iconType(
  dexNumber: number,
  formIndex: number,
  extraFormIndex: Option<ExtraFormIndex>
): IconType {
  const formeMetadata = MetadataSummaryLookup(dexNumber, formIndex ?? 0)
  const inChampions = !isRestricted(CHAMPS_TRANSFER_RESTRICTIONS, dexNumber, formIndex)
  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9
  const extraFormWithSprite = Boolean(extraFormIndex && extraFormSpriteName(extraFormIndex))

  const shouldUseImage =
    inChampions ||
    isGen9Mega ||
    extraFormWithSprite ||
    FormsUsingImages.get(dexNumber)?.includes(formIndex ?? 0)

  return shouldUseImage ? 'image' : 'spritesheet'
}
