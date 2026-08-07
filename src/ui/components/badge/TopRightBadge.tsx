import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { TopRightBadgeType } from '@openhome-ui/hooks/monDisplay'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { BallsImageList } from '@openhome-ui/images/items'
import { Pokerus, StatsPreSplit } from '@pkm-rs/pkg/pkm_rs'
import GenderIcon from '../pokemon/GenderIcon'
import './Badge.css'
import { BaseBadge } from './BaseBadge'
import { GameBadge } from './GameBadge'
import { ImageBadge } from './ImageBadge'

type TopRightBadgeProps = {
  mon: PKMInterface
  badgeType: TopRightBadgeType
}

const EV_STAT_MAX = 252
const EV_TOTAL_MAX = 508
const STAT_TYPE_COUNT = 6
const MAX_LEVEL = 100

export function TopRightBadge({ mon, badgeType: indicatorType }: TopRightBadgeProps) {
  switch (indicatorType) {
    case 'Gender':
      return <GenderIcon gender={mon.gender} />
    case 'Level':
      return <NumericalBadge value={mon.getLevel()} max={MAX_LEVEL} />
    case 'EVs (Total)':
      const evsTotal = Object.values(mon.evs ?? mon.evsG12 ?? {}).reduce((p, c) => p + c, 0)
      return <NumericalBadge value={evsTotal} max={EV_TOTAL_MAX} />
    case 'EV (HP)':
      return <NumericalBadge value={mon.evs?.hp} max={EV_STAT_MAX} />
    case 'EV (Attack)':
      return <NumericalBadge value={mon.evs?.atk} max={EV_STAT_MAX} />
    case 'EV (Defense)':
      return <NumericalBadge value={mon.evs?.def} max={EV_STAT_MAX} />
    case 'EV (Special Attack)':
      return <NumericalBadge value={mon.evs?.spa} max={EV_STAT_MAX} />
    case 'EV (Special Defense)':
      return <NumericalBadge value={mon.evs?.spd} max={EV_STAT_MAX} />
    case 'EV (Speed)':
      return <NumericalBadge value={mon.evs?.spe} max={EV_STAT_MAX} />
    case 'IVs/DVs (Percent)':
      const ivsOrDvsPercent = mon.ivs ? getIvsPercent(mon) : hasDvs(mon) ? getDvsPercent(mon) : 0
      return <NumericalBadge value={ivsOrDvsPercent} percent />
    case 'Perfect IVs Count':
      const perfectIvsCount = getPerfectIvsCount(mon)
      return <NumericalBadge value={perfectIvsCount} max={STAT_TYPE_COUNT} />
    case 'Origin Game':
      return <GameBadge originGame={mon.gameOfOrigin} plugin={mon.pluginOrigin} />
    case 'Most Recent Save':
      return mon instanceof OHPKM && <GameBadge originGame={mon.mostRecentSaveWasm?.game} />
    case 'Ribbon Count':
      return <NumericalBadge value={mon.ribbons?.length} max={3} /> // TODO: better handle color for ribbon count
    case 'Ball':
      return (
        mon.ball && (
          <img draggable={false} style={{ width: 24, height: 24 }} src={BallsImageList[mon.ball]} />
        )
      )
    case 'Alpha':
      return (
        mon.isAlpha && (
          <ImageBadge
            tooltip="Alpha"
            src={getPublicImageURL('icons/Alpha.png')}
            backgroundColor="#f2352d"
          />
        )
      )
    case 'Gigantamax':
      return (
        mon.canGigantamax && (
          <ImageBadge
            tooltip="Gigantamax"
            src={getPublicImageURL('icons/GMax.png')}
            backgroundColor="#e60040"
          />
        )
      )
    case 'Pokérus':
      const pokerus = Pokerus.fromByte(mon.pokerusByte ?? 0)
      switch (pokerus.status()) {
        case 'Uninfected':
          return null
        case 'Infected':
          return (
            <ImageBadge
              tooltip="Gigantamax"
              src={getPublicImageURL('icons/pokerus-infected.png')}
              backgroundColor="#eb3cae"
            />
          )
        case 'Cured':
          return (
            <ImageBadge
              tooltip="Gigantamax"
              src={getPublicImageURL('icons/pokerus-cured.png')}
              backgroundColor="#eb3cae"
            />
          )
      }

    default:
      return null
  }
}

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

function hasDvs(mon: PKMInterface): mon is PKMInterface & { dvs: StatsPreSplit } {
  return (mon as any).dvs !== undefined
}

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

function getIvsPercent(mon: PKMInterface): number {
  const ivsTotal = Object.values(mon.ivs ?? {}).reduce((p, c) => p + c, 0)
  return Math.round((ivsTotal / (6 * 31)) * 100)
}

function getDvsPercent(mon: PKMInterface & { dvs: StatsPreSplit }): number {
  const dvsTotal = Object.values(mon.dvs).reduce((p, c) => p + c, 0)
  return Math.round((dvsTotal / (5 * 15)) * 100)
}

function getPerfectIvsCount(mon: PKMInterface): number {
  if (!mon.ivs) return 0
  return Object.values(mon.ivs).filter((iv) => iv === 31).length
}
