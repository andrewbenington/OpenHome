import { HTMLAttributes } from 'react'
import { POKEMON_DATA } from '../../consts'
import BoxIcons from '../images/BoxIcons.png'
import './components.css'
import { getPublicImageURL } from '../images/images'
import { getItemIconPath } from '../images/items'

interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  dexNumber: number
  formeNumber?: number
  isShiny?: boolean
  heldItemIndex?: number
  heldItemFormat?: string
  greyedOut?: boolean
}

export default function PokemonIcon(props: PokemonIconProps) {
  const {
    dexNumber,
    formeNumber,
    isShiny,
    heldItemIndex,
    heldItemFormat,
    greyedOut,
    ...attributes
  } = props

  const getBackgroundPosition = (mon: { dexNum: number; formNum: number }) => {
    console.log(mon.dexNum, mon.formNum, POKEMON_DATA[mon.dexNum].formes[mon.formNum])
    if (!POKEMON_DATA[mon.dexNum].formes[mon.formNum]) {
      return '0% 0%'
    }
    const [x, y] = POKEMON_DATA[mon.dexNum].formes[mon.formNum].spriteIndex
    return `${(x / 35) * 100}% ${(y / 36) * 100}%`
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
          backgroundPosition: getBackgroundPosition({
            dexNum: dexNumber,
            formNum: formeNumber ?? 0,
          }),
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
