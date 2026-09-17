import { $R } from '@openhome-core/util/functional'
import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getItemIconPath } from '@openhome-ui/images/items'
import { getPokemonSpritePathInner } from '@openhome-ui/images/pokemon'
import { ExtraFormIndex, Gender, NationalDex } from '@pkm-rs/pkg'
import { HTMLAttributes, memo, MouseEventHandler, ReactNode, useState } from 'react'
import { MonDisplayState, useMonDisplay } from '../hooks/monDisplay'
import { boxIconImagePath } from '../pokemon-details/useBoxIconImage'
import { classNames, grayscaleIf } from '../util/style'
import { MonTag } from '../util/tags'
import { TagIcon } from './TagIcon'
import './components.css'

export interface PokemonIconProps extends HTMLAttributes<HTMLDivElement> {
  nationalDex: number
  formIndex?: number
  isShiny?: boolean
  gender?: Gender
  isEgg?: boolean
  heldItemIndex?: number
  onlyItem?: boolean
  grayedOut?: boolean
  silhouette?: boolean
  topRightIndicator?: ReactNode
  extraFormIndex?: ExtraFormIndex
  tags?: MonTag[]
  hasNotes?: boolean
  monDisplayState?: MonDisplayState
}

const PokemonIcon = memo((props: PokemonIconProps) => {
  const {
    heldItemIndex,
    onlyItem,
    grayedOut,
    topRightIndicator,
    tags,
    hasNotes,
    style,
    ...iconProps
  } = props
  const { showNotesIndicator, showTags } = useMonDisplay()

  return (
    <div
      className={classNames('pokemon-icon-container', grayscaleIf(grayedOut), 'flex-centered')}
      style={style}
    >
      {!onlyItem && <PokemonIconImage {...iconProps} />}
      {props.isShiny && (
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
      {topRightIndicator && <div className="extra-badge">{topRightIndicator}</div>}
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
      ) : null}
    </div>
  )
})

interface PokemonIconImageProps {
  nationalDex: number
  formIndex?: number
  extraFormIndex?: number
  silhouette?: boolean
  isEgg?: boolean
  isShiny?: boolean
  gender?: Gender
  onClick?: MouseEventHandler
}

const DEFAULT_BOX_ICON = `/items/index/0000.png`

function getBoxIconImage(props: PokemonIconImageProps) {
  return $R(
    boxIconImagePath({
      nationalDex: props.nationalDex,
      formIndex: props.formIndex ?? 0,
      format: 'OHPKM',
      extraFormIndex: props.extraFormIndex,
      isShiny: props.isShiny,
      isFemale: props.gender === Gender.Female,
    })
  )
}

function PokemonIconImage(props: PokemonIconImageProps) {
  const { silhouette, onClick, isEgg } = props
  const [spritePath, setSpritePath] = useState(
    isEgg ? getPublicImageURL('sprites/box-home/egg.webp') : DEFAULT_BOX_ICON
  )
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const isDarkMode = useIsDarkMode()

  if (spritePath === DEFAULT_BOX_ICON && !imageLoadFailed) {
    getBoxIconImage(props).match(
      (path: string) => {
        setSpritePath(getPublicImageURL(path))
      },
      (err: string) => {
        setImageLoadFailed(true)
        console.error(err)
      }
    )
  }

  return (
    <img
      className="pokemon-icon-img"
      alt="pokemon sprite"
      draggable={false}
      src={spritePath}
      style={{
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

        const homePath = getPokemonSpritePathInner(
          {
            ...props,
            formIndex: props.formIndex ?? 0,
            format: 'OHPKM',
            extraFormIndex: props.extraFormIndex,
          },
          'box-home',
          'webp'
        )

        if (spritePath !== getPublicImageURL(homePath)) {
          setSpritePath(getPublicImageURL(homePath))
        } else {
          console.assert(props.nationalDex !== NationalDex.Farfetchd, getPublicImageURL(homePath))
          setImageLoadFailed(true)
          setSpritePath(DEFAULT_BOX_ICON)
        }
      }}
    />
  )
}

export default PokemonIcon
