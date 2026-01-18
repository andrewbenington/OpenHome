import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.png'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import useMonSprite from '@openhome-ui/pokemon-details//useMonSprite'
import { MonSpriteData } from '@openhome-ui/state/plugin'
import { FormeMetadata, Generation, MetadataLookup } from '@pkm-rs/pkg'
import { HTMLAttributes, ReactNode } from 'react'
import { classNames, grayscaleIf } from '../util/style'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
  format?: MonSpriteData['format']
  formArgument?: MonSpriteData['formArgument']
  isShiny?: boolean
  isEgg?: boolean
  isFemale?: boolean
  heldItemIndex?: number
  onlyItem?: boolean
  grayedOut?: boolean
  silhouette?: boolean
  topRightIndicator?: ReactNode
  useAnimatedSprite?: boolean
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
    format = 'OHPKM',
    formArgument,
    isShiny,
    heldItemIndex,
    onlyItem,
    grayedOut,
    silhouette,
    isEgg,
    isFemale,
    topRightIndicator,
    style,
    useAnimatedSprite,
  } = props

  const isDarkMode = useIsDarkMode()
  const formeMetadata = MetadataLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9

  const spriteResult = useMonSprite({
    dexNum: dexNumber,
    formeNum: formeNumber ?? 0,
    format,
    formArgument,
    heldItemIndex,
    isFemale,
    isShiny,
  })

  const shouldUseAnimatedSprite = Boolean(
    useAnimatedSprite && !isEgg && spriteResult.path && !spriteResult.errorMessage
  )

  const monImage = shouldUseAnimatedSprite ? (
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
    />
  ) : isGen9Mega ? (
    <PokemonIconUsingImage
      dexNumber={dexNumber}
      formeNumber={formeNumber}
      silhouette={silhouette}
    />
  ) : formeMetadata ? (
    <PokemonIconUsingSheet formeMetadata={formeMetadata} isEgg={isEgg} silhouette={silhouette} />
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
      {topRightIndicator && <div className="extra-indicator">{topRightIndicator}</div>}
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
}

function PokemonIconUsingSheet(props: PokemonIconUsingSheetProps) {
  const { formeMetadata, isEgg, silhouette } = props

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
    />
  )
}

interface PokemonIconUsingImageProps {
  dexNumber: number
  formeNumber?: number
  silhouette?: boolean
}

function PokemonIconUsingImage(props: PokemonIconUsingImageProps) {
  const { dexNumber, formeNumber, silhouette } = props

  const isDarkMode = useIsDarkMode()

  const spriteResult = useMonSprite({
    dexNum: dexNumber,
    formeNum: formeNumber ?? 0,
    format: 'OHPKM',
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
    />
  )
}
