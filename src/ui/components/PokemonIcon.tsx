import { CHAMPS_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Option, R } from '@openhome-core/util/functional'
import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.webp'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import {
  ExtraFormIndex,
  extraFormSpriteName,
  FormMetadata,
  Generation,
  MetadataSummaryLookup,
} from '@pkm-rs/pkg'
import { HTMLAttributes, MouseEventHandler, ReactNode, useState } from 'react'
import { useMonDisplay } from '../hooks/monDisplay'
import { boxIconImagePath, FormsUsingImages } from '../pokemon-details/useBoxIconImage'
import { classNames, grayscaleIf } from '../util/style'
import { MonTag } from '../util/tags'
import { TagIcon } from './TagIcon'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formIndex?: number
  isShiny?: boolean
  isEgg?: boolean
  heldItemIndex?: number
  onlyItem?: boolean
  grayedOut?: boolean
  silhouette?: boolean
  topRightIndicator?: ReactNode
  extraFormIndex?: ExtraFormIndex
  tags?: MonTag[]
  hasNotes?: boolean
}

function getBackgroundPosition(formeMetadata?: FormMetadata, isEgg?: boolean) {
  const [x, y] =
    isEgg ||
    !formeMetadata ||
    (formeMetadata.isMega && formeMetadata.introducedGen === Generation.G9)
      ? [0, 0]
      : formeMetadata.spriteCoords

  return `${(x / 35) * 100}% ${(y / 36) * 100}%`
}

type IconType = 'spritesheet' | 'image'

function iconType(
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

export default function PokemonIcon(props: PokemonIconProps) {
  const {
    dexNumber,
    formIndex,
    isShiny,
    heldItemIndex,
    onlyItem,
    grayedOut,
    silhouette,
    isEgg,
    topRightIndicator,
    tags,
    hasNotes,
    style,
    onClick,
    extraFormIndex,
  } = props
  const { showNotesIndicator, showTags } = useMonDisplay()

  let monImage = null

  switch (iconType(dexNumber, formIndex ?? 0, extraFormIndex)) {
    case 'image': {
      monImage = (
        <PokemonIconUsingImage
          dexNumber={dexNumber}
          formeNumber={formIndex}
          extraFormIndex={extraFormIndex}
          silhouette={silhouette}
          onClick={onClick}
          isShiny={isShiny}
        />
      )
      break
    }
    case 'spritesheet':
      const formeMetadata = MetadataSummaryLookup(dexNumber, formIndex ?? 0)
      monImage = formeMetadata ? (
        <PokemonIconUsingSheet
          formeMetadata={formeMetadata}
          isEgg={isEgg}
          silhouette={silhouette}
          onClick={onClick}
        />
      ) : null
      break
  }

  return (
    <div className={classNames('pokemon-icon-container', grayscaleIf(grayedOut))} style={style}>
      {!onlyItem && monImage}
      {isShiny && (
        <img
          alt="shiny icon"
          className="shiny-icon"
          draggable={false}
          src={getPublicImageURL('icons/Shiny.png')}
        />
      )}
      {showTags && tags && tags.length > 0 && (
        <div className="pokemon-icon-tags">
          {tags.map((tag, i) => (
            <div key={i} className="pokemon-icon-tag" style={{ backgroundColor: tag.color }}>
              <TagIcon iconName={tag.icon} size={8} />
            </div>
          ))}
        </div>
      )}
      {topRightIndicator && <div className="extra-indicator">{topRightIndicator}</div>}
      {hasNotes && showNotesIndicator && (
        <div title="Has notes" className="pokemon-icon-notes-dot" />
      )}
      {heldItemIndex ? (
        <img
          alt="item icon"
          className="item-icon"
          draggable={false}
          src={getPublicImageURL(getItemIconPath(heldItemIndex))}
        />
      ) : (
        <></>
      )}
    </div>
  )
}

interface PokemonIconUsingSheetProps {
  formeMetadata: FormMetadata
  isEgg?: boolean
  silhouette?: boolean
  onClick?: MouseEventHandler
}

function PokemonIconUsingSheet(props: PokemonIconUsingSheetProps) {
  const { formeMetadata, isEgg, silhouette, onClick } = props

  const isDarkMode = useIsDarkMode()

  return (
    <div
      draggable={false}
      className="pokemon-spritesheet-icon"
      style={{
        backgroundImage: `url(${BoxIcons})`,
        backgroundPosition: getBackgroundPosition(formeMetadata, isEgg),
        filter: silhouette
          ? isDarkMode
            ? 'contrast(0%) brightness(85%)'
            : 'contrast(0%) brightness(25%)'
          : undefined,
      }}
      onClick={onClick}
    />
  )
}

interface PokemonIconUsingImageProps {
  dexNumber: number
  formeNumber?: number
  extraFormIndex?: number
  silhouette?: boolean
  isShiny?: boolean
  onClick?: MouseEventHandler
}

const DEFAULT_BOX_ICON = `/items/index/0000.png`

function PokemonIconUsingImage(props: PokemonIconUsingImageProps) {
  const { dexNumber, formeNumber, extraFormIndex, silhouette, onClick } = props
  const [spritePath, setSpritePath] = useState(DEFAULT_BOX_ICON)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)

  const isDarkMode = useIsDarkMode()

  if (spritePath === DEFAULT_BOX_ICON && !imageLoadFailed) {
    const spriteResult = boxIconImagePath({
      dexNum: dexNumber,
      formNum: formeNumber ?? 0,
      format: 'OHPKM',
      extraFormIndex,
      isShiny: props.isShiny,
    })
    R.match(
      (path: string) => {
        setSpritePath(getPublicImageURL(path))
      },
      (err: string) => {
        console.error(err)
      }
    )(spriteResult)
  }

  return (
    <img
      className="pokemon-icon-img"
      alt="pokemon sprite"
      draggable={false}
      src={spritePath}
      style={{
        imageRendering: 'pixelated',
        filter: silhouette
          ? isDarkMode
            ? 'contrast(0%) brightness(85%)'
            : 'contrast(0%) brightness(25%)'
          : undefined,
      }}
      onClick={onClick}
      onError={() => {
        console.error({
          event: 'box-sprite-image-error',
          url: spritePath,
        })
        setImageLoadFailed(true)
        setSpritePath(DEFAULT_BOX_ICON)
      }}
    />
  )
}
