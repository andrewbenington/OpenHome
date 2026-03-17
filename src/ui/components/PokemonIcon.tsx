import { getLumiCustomForm } from '@openhome-core/save/luminescentplatinum/conversion/LuminescentPlatinumFormMap'
import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import BoxIcons from '@openhome-ui/images/BoxIcons.webp'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import useMonSprite from '@openhome-ui/pokemon-details//useMonSprite'
import { FormeMetadata, Generation, MetadataLookup } from '@pkm-rs/pkg'
import { HTMLAttributes, MouseEventHandler, ReactNode } from 'react'
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
  pluginForm?: number
  pluginOrigin?: string
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
    pluginForm,
    pluginOrigin,
  } = props

  const formeMetadata = MetadataLookup(dexNumber, formeNumber ?? 0)

  const isGen9Mega = formeMetadata?.isMega && formeMetadata.introducedGen === Generation.G9
  const isLumiCustomForm =
    pluginOrigin === 'luminescent_platinum' &&
    pluginForm !== undefined &&
    !!getLumiCustomForm(dexNumber, pluginForm)

  const monImage =
    isGen9Mega || isLumiCustomForm ? (
      <PokemonIconUsingImage
        dexNumber={dexNumber}
        formeNumber={formeNumber}
        pluginForm={pluginForm}
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
      {tags && tags.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 3,
          }}
        >
          {tags.map((tag, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: tag.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                color: 'white',
              }}
            >
              <TagIcon iconName={tag.icon} size={8} />
            </div>
          ))}
        </div>
      )}
      {topRightIndicator && <div className="extra-indicator">{topRightIndicator}</div>}
      {hasNotes && (
        <div
          title="Has notes"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#facc15',
            boxShadow: '0 0 2px rgba(0,0,0,0.6)',
            zIndex: 3,
          }}
        />
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
  pluginForm?: number
  pluginOrigin?: string
  silhouette?: boolean
  onClick?: MouseEventHandler
}

function PokemonIconUsingImage(props: PokemonIconUsingImageProps) {
  const { dexNumber, formeNumber, pluginForm, pluginOrigin, silhouette, onClick } = props

  const isDarkMode = useIsDarkMode()

  const spriteResult = useMonSprite({
    dexNum: dexNumber,
    formeNum: formeNumber ?? 0,
    format: pluginOrigin === 'luminescent_platinum' ? 'PB8LUMI' : 'OHPKM',
    pluginForm,
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
