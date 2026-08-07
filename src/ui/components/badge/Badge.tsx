import { pluralize } from '@openhome-core/util/format'
import { Option } from '@openhome-core/util/functional'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { Pokerus } from '@pkm-rs/pkg'
import { BaseBadge } from './BaseBadge'
import { GameBadge } from './GameBadge'
import { ImageBadge } from './ImageBadge'

type TopRightNumericalBadgeProps = {
  value?: number
  percent?: boolean
} & (
  | {
      percent?: false
      max: number
    }
  | {
      percent: true
      max?: undefined
    }
)

function colorByPercent(percent: number) {
  if (percent < 30) return '#bbb'
  if (percent < 65) return `hsl(39, 80%, 71%)`
  if (percent < 90) return 'hsl(75, 80%, 70%)'
  if (percent < 100) return 'hsl(105, 89%, 58%)'
  return 'hsl(204, 99%, 65%)'
}

function NumericalBadge({ value, percent, max: maxProp }: TopRightNumericalBadgeProps) {
  if (value === undefined) return null

  const color = colorByPercent(percent ? value : Math.min((value / maxProp) * 100, 100))
  return (
    value !== undefined &&
    (percent || value > 0) && (
      <BaseBadge className="numerical-badge" backgroundColor={color}>
        {value}
        {percent ? '%' : ''}
      </BaseBadge>
    )
  )
}

export type BadgeProps = {
  className?: string
  tooltip?: string
  color?: string
  backgroundColor?: string
  style?: React.CSSProperties
  showIf?: Option<boolean>
  showLabel?: boolean
}

function labelIf(showLabel: Option<boolean>, label: Option<string>): Option<string> {
  return showLabel ? label : undefined
}

function AlphaBadge(props: BadgeProps) {
  const label = labelIf(props.showLabel, 'Alpha')
  return (
    <ImageBadge
      tooltip="Alpha"
      src={getPublicImageURL('icons/Alpha.png')}
      backgroundColor="#f2352d"
      label={label}
      {...props}
    />
  )
}

function GigantamaxBadge(props: BadgeProps) {
  const label = labelIf(props.showLabel, 'Gigantamax')
  return (
    <ImageBadge
      tooltip="Gigantamax"
      src={getPublicImageURL('icons/GMax.png')}
      backgroundColor="#e60040"
      label={label}
      {...props}
    />
  )
}

function PokerusBadge(props: BadgeProps & { pokerusByte: Option<number> }) {
  const pokerus = Pokerus.fromByte(props.pokerusByte ?? 0)
  switch (pokerus.status()) {
    case 'Uninfected':
      return null
    case 'Infected': {
      const message = `${pluralize(pokerus.daysRemaining(), 'Day')} Remaining`
      const label = labelIf(props.showLabel, message)
      return (
        <ImageBadge
          src={getPublicImageURL('icons/pokerus-infected.png')}
          color="white"
          backgroundColor="#eb3cae"
          label={label}
          tooltip={`Pokérus: ${message}`}
          {...props}
        />
      )
    }
    case 'Cured': {
      const label = labelIf(props.showLabel, 'Cured')
      return (
        <ImageBadge
          src={getPublicImageURL('icons/pokerus-cured.png')}
          backgroundColor="white"
          color="#eb3cae"
          label={label}
          tooltip="Pokérus: Cured"
          {...props}
        />
      )
    }
  }
}

const Badge = {
  Alpha: AlphaBadge,
  Game: GameBadge,
  Gigantamax: GigantamaxBadge,
  Image: ImageBadge,
  Numerical: NumericalBadge,
  Pokerus: PokerusBadge,
}

export default Badge
