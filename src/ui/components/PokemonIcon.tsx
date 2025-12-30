import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.png'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import useMonSprite from '@openhome-ui/pokemon-details//useMonSprite'
import { FormeMetadata, Generation, MetadataLookup } from '@pkm-rs/pkg'
import { HTMLAttributes, ReactNode } from 'react'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
  isShiny?: boolean
  isEgg?: boolean
  heldItemIndex?: number
  onlyItem?: boolean
  greyedOut?: boolean
  silhouette?: boolean
  topRightIndicator?: ReactNode
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
    greyedOut,
    silhouette,
    isEgg,
    topRightIndicator,
    style,
  } = props

  // if (dexNumber === NationalDex.Ursaluna) {
  //   console.log('rendering PokemonIcon')
  // }
  // useEffect(() => {
  //   if (dexNumber === NationalDex.Ursaluna) {
  //     console.log('something changed')
  //   }
  // }, [props])

  const formeMetadata = MetadataLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9

  const monImage = isGen9Mega ? (
    <PokemonIconUsingImage
      dexNumber={dexNumber}
      formeNumber={formeNumber}
      silhouette={silhouette}
    />
  ) : formeMetadata ? (
    <PokemonIconUsingSheet formeMetadata={formeMetadata} isEgg={isEgg} silhouette={silhouette} />
  ) : null

  const className = greyedOut ? 'pokemon-icon-container greyed-out' : 'pokemon-icon-container'

  return (
    <div className={className} style={style}>
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
      alt="pokemon sprite"
      draggable={false}
      src={spriteResult.path}
      style={{
        width: '100%',
        height: '100%',
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
