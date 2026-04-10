import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.webp'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { FormsUsingImages } from '@openhome-ui/pokemon-details/useBoxIconImage'
import {
  ExtraFormIndex,
  extraFormSpriteName,
  FormeMetadata,
  Generation,
  MetadataSummaryLookup,
} from '@pkm-rs/pkg'
import { HTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { useMonDisplay } from '../hooks/useMonDisplay'
import useBoxIconImage from '../pokemon-details/useBoxIconImage'
import { classNames, grayscaleIf } from '../util/style'
import { MonTag } from '../util/tags'
import { TagIcon } from './TagIcon'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
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

function getBackgroundPosition(formeMetadata?: FormeMetadata, isEgg?: boolean) {
  const [x, y] =
    isEgg ||
    !formeMetadata ||
    (formeMetadata.isMega && formeMetadata.introducedGen === Generation.G9)
      ? [0, 0]
      : formeMetadata.spriteCoords

  return `${(x / 35) * 100}% ${(y / 36) * 100}%`
}

export default function PokemonIcon(props: PokemonIconProps) {
  const {
    dexNumber,
    formeNumber,
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

  const formeMetadata = MetadataSummaryLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9
  const extraFormWithSprite = Boolean(extraFormIndex && extraFormSpriteName(extraFormIndex))

  const shouldUseImage =
    isGen9Mega || extraFormWithSprite || FormsUsingImages.get(dexNumber)?.includes(formeNumber ?? 0)

  const monImage = shouldUseImage ? (
    <PokemonIconUsingImage
      dexNumber={dexNumber}
      formeNumber={formeNumber}
      extraFormIndex={extraFormIndex}
      silhouette={silhouette}
      onClick={onClick}
    />
  ) : formeMetadata ? (
    <PokemonIconUsingSheet
      formeMetadata={formeMetadata}
      isEgg={isEgg}
      silhouette={silhouette}
      onClick={onClick}
    />
  ) : null

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
  formeMetadata: FormeMetadata
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
      className="pokemon-icon-image"
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
  onClick?: MouseEventHandler
}

function PokemonIconUsingImage(props: PokemonIconUsingImageProps) {
  const { dexNumber, formeNumber, extraFormIndex, silhouette, onClick } = props

  const isDarkMode = useIsDarkMode()

  const spriteResult = useBoxIconImage({
    dexNum: dexNumber,
    formNum: formeNumber ?? 0,
    format: 'OHPKM',
    extraFormIndex,
  })

  return (
    <img
      className="fill-parent"
      alt="pokemon sprite"
      draggable={false}
      src={spriteResult.path}
      style={{
        imageRendering: 'pixelated',
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
