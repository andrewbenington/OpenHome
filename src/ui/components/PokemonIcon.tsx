import { getLumiCustomForm } from '@openhome-core/save/luminescentplatinum/conversion/LuminescentPlatinumFormMap'
import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.webp'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { FormsUsingImages } from '@openhome-ui/pokemon-details/useBoxIconImage'
import { FormeMetadata, Generation, MetadataLookup } from '@pkm-rs/pkg'
import { HTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import useBoxIconImage from '../pokemon-details/useBoxIconImage'
import { classNames, grayscaleIf } from '../util/style'
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
  pluginForm?: number
  pluginOrigin?: string
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
    style,
    onClick,
    pluginForm,
    pluginOrigin,
  } = props

  const formeMetadata = MetadataLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9
  const isLumiCustomForm =
    pluginOrigin === 'luminescent_platinum' &&
    pluginForm !== undefined &&
    !!getLumiCustomForm(dexNumber, pluginForm)
  const shouldUseImage =
    isGen9Mega || isLumiCustomForm || FormsUsingImages.get(dexNumber)?.includes(formeNumber ?? 0)

  const monImage = shouldUseImage ? (
    <PokemonIconUsingImage
      dexNumber={dexNumber}
      formeNumber={formeNumber}
      extraFormIndex={pluginForm}
      pluginOrigin={pluginOrigin}
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
  pluginOrigin?: string
  silhouette?: boolean
  onClick?: MouseEventHandler
}

function PokemonIconUsingImage(props: PokemonIconUsingImageProps) {
  const { dexNumber, formeNumber, extraFormIndex, pluginOrigin, silhouette, onClick } = props

  const isDarkMode = useIsDarkMode()

  const spriteResult = useBoxIconImage({
    dexNum: dexNumber,
    formeNum: formeNumber ?? 0,
    format: pluginOrigin === 'luminescent_platinum' ? 'PB8LUMI' : 'OHPKM',
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
