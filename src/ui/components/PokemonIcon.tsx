import { FormeMetadata, Generation, MetadataLookup } from '@pkm-rs/pkg'
import { HTMLAttributes } from 'react'
import useIsDarkMode from 'src/ui/hooks/dark-mode'
import BoxIcons from 'src/ui/images/BoxIcons.png'
import { getPublicImageURL } from 'src/ui/images/images'
import { getItemIconPath } from 'src/ui/images/items'
import useMonSprite from 'src/ui/pokemon-details//useMonSprite'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
  isShiny?: boolean
  isEgg?: boolean
  heldItemIndex?: number
  greyedOut?: boolean
  silhouette?: boolean
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
    greyedOut,
    silhouette,
    isEgg,
    ...attributes
  } = props

  const formeMetadata = MetadataLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9

  const isDarkMode = useIsDarkMode()

  if (isGen9Mega) {
    return (
      <PokemonIconUsingSprite
        dexNumber={dexNumber}
        formeNumber={formeNumber}
        isShiny={isShiny}
        heldItemIndex={heldItemIndex}
        greyedOut={greyedOut}
        silhouette={silhouette}
        isEgg={isEgg}
        {...attributes}
      />
    )
  }

  return (
    <div
      className="pokemon-icon-container"
      {...attributes}
      style={{
        ...attributes.style,
        filter: greyedOut ? 'grayscale(100%)' : undefined,
      }}
    >
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
      {isShiny && (
        <img
          alt="shiny icon"
          draggable={false}
          src={getPublicImageURL('icons/Shiny.png')}
          style={{
            position: 'absolute',
            width: '40%',
            height: '40%',
            left: 0,
            top: 0,
            zIndex: 2,
            pointerEvents: 'none',
            filter: greyedOut ? 'grayscale(100%)' : undefined,
          }}
        />
      )}
      {heldItemIndex ? (
        <img
          alt="item icon"
          draggable={false}
          src={getPublicImageURL(getItemIconPath(heldItemIndex))}
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            right: 0,
            bottom: 0,
            zIndex: 2,
            pointerEvents: 'none',
            filter: greyedOut ? 'grayscale(100%)' : undefined,
          }}
        />
      ) : (
        <></>
      )}
    </div>
  )
}

function PokemonIconUsingSprite(props: PokemonIconProps) {
  const { dexNumber, formeNumber, isShiny, heldItemIndex, greyedOut, silhouette, ...attributes } =
    props

  const spriteResult = useMonSprite({
    dexNum: dexNumber,
    formeNum: formeNumber ?? 0,
    format: 'OHPKM',
    isShiny,
  })

  const isDarkMode = useIsDarkMode()

  return (
    <div
      className="pokemon-icon-container"
      {...attributes}
      style={{
        ...attributes.style,
        filter: greyedOut ? 'grayscale(100%)' : undefined,
      }}
    >
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
      {isShiny && (
        <img
          alt="shiny icon"
          draggable={false}
          src={getPublicImageURL('icons/Shiny.png')}
          style={{
            position: 'absolute',
            width: '40%',
            height: '40%',
            left: 0,
            top: 0,
            zIndex: 2,
            pointerEvents: 'none',
            filter: greyedOut ? 'grayscale(100%)' : undefined,
          }}
        />
      )}
      {heldItemIndex ? (
        <img
          alt="item icon"
          draggable={false}
          src={getPublicImageURL(getItemIconPath(heldItemIndex))}
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            right: 0,
            bottom: 0,
            zIndex: 2,
            pointerEvents: 'none',
            filter: greyedOut ? 'grayscale(100%)' : undefined,
          }}
        />
      ) : (
        <></>
      )}
    </div>
  )
}
