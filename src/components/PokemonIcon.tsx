import { PokemonData } from 'pokemon-species-data'
import { HTMLAttributes } from 'react'
import useIsDarkMode from 'src/hooks/dark-mode'
import BoxIcons from '../images/BoxIcons.png'
import { getPublicImageURL } from '../images/images'
import { getItemIconPath } from '../images/items'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
  isShiny?: boolean
  heldItemIndex?: number
  heldItemFormat?: string
  greyedOut?: boolean
  silhouette?: boolean
}

export default function PokemonIcon(props: PokemonIconProps) {
  const {
    dexNumber,
    formeNumber,
    isShiny,
    heldItemIndex,
    heldItemFormat,
    greyedOut,
    silhouette,
    ...attributes
  } = props

  const getBackgroundPosition = (mon: { dexNum: number; formeNum: number }) => {
    if (!PokemonData[mon.dexNum]?.formes[mon.formeNum]) {
      return '0% 0%'
    }
    const [x, y] = PokemonData[mon.dexNum].formes[mon.formeNum].spriteIndex

    return `${(x / 35) * 100}% ${(y / 36) * 100}%`
  }

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
      <div
        draggable={false}
        className="pokemon-icon-image"
        style={{
          backgroundImage: `url(${BoxIcons})`,
          backgroundPosition: getBackgroundPosition({
            dexNum: dexNumber,
            formeNum: formeNumber ?? 0,
          }),
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
          src={getPublicImageURL(getItemIconPath(heldItemIndex, heldItemFormat ?? 'PK9'))}
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
