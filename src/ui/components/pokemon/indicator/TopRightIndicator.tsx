import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { StatsPreSplit } from '@pkm-rs/pkg/pkm_rs'
import { TopRightIndicatorType } from '../../../hooks/monDisplay'
import { getPublicImageURL } from '../../../images/images'
import { BallsImageList } from '../../../images/items'
import GenderIcon from '../GenderIcon'
import { GameIndicator } from './GameIndicator'
import { ImageIndicator } from './ImageIndicator'
import { Indicator } from './Indicator'
import './Indicator.css'

type TopRightIndicatorProps = {
  mon: PKMInterface
  indicatorType: TopRightIndicatorType
}

const EV_STAT_MAX = 252
const EV_TOTAL_MAX = 508
const STAT_TYPE_COUNT = 6
const MAX_LEVEL = 100

export function TopRightIndicator({ mon, indicatorType }: TopRightIndicatorProps) {
  switch (indicatorType) {
    case 'Gender':
      return <GenderIcon gender={mon.gender} />
    case 'Level':
      return <NumericalIndicator value={mon.getLevel()} max={MAX_LEVEL} />
    case 'EVs (Total)':
      const evsTotal = Object.values(mon.evs ?? mon.evsG12 ?? {}).reduce((p, c) => p + c, 0)
      return <NumericalIndicator value={evsTotal} max={EV_TOTAL_MAX} />
    case 'EV (HP)':
      return <NumericalIndicator value={mon.evs?.hp} max={EV_STAT_MAX} />
    case 'EV (Attack)':
      return <NumericalIndicator value={mon.evs?.atk} max={EV_STAT_MAX} />
    case 'EV (Defense)':
      return <NumericalIndicator value={mon.evs?.def} max={EV_STAT_MAX} />
    case 'EV (Special Attack)':
      return <NumericalIndicator value={mon.evs?.spa} max={EV_STAT_MAX} />
    case 'EV (Special Defense)':
      return <NumericalIndicator value={mon.evs?.spd} max={EV_STAT_MAX} />
    case 'EV (Speed)':
      return <NumericalIndicator value={mon.evs?.spe} max={EV_STAT_MAX} />
    case 'IVs/DVs (Percent)':
      const ivsOrDvsPercent = mon.ivs ? getIvsPercent(mon) : hasDvs(mon) ? getDvsPercent(mon) : 0
      return <NumericalIndicator value={ivsOrDvsPercent} percent />
    case 'Perfect IVs Count':
      const perfectIvsCount = getPerfectIvsCount(mon)
      return <NumericalIndicator value={perfectIvsCount} max={STAT_TYPE_COUNT} />
    case 'Origin Game':
      return <GameIndicator originGame={mon.gameOfOrigin} plugin={mon.pluginOrigin} />
    case 'Most Recent Save':
      return mon instanceof OHPKM && <GameIndicator originGame={mon.mostRecentSaveWasm?.game} />
    case 'Ribbon Count':
      return <NumericalIndicator value={mon.ribbons?.length} max={3} /> // TODO: better handle color for ribbon count
    case 'Ball':
      return (
        mon.ball && (
          <img draggable={false} style={{ width: 24, height: 24 }} src={BallsImageList[mon.ball]} />
        )
      )
    case 'Alpha':
      return (
        mon.isAlpha && (
          <ImageIndicator
            tooltip="Alpha"
            src={getPublicImageURL('icons/Alpha.png')}
            backgroundColor="#f2352d"
          />
        )
      )
    case 'Gigantamax':
      return (
        mon.canGigantamax && (
          <ImageIndicator
            tooltip="Gigantamax"
            src={getPublicImageURL('icons/GMax.png')}
            backgroundColor="#e60040"
          />
        )
      )
    default:
      return null
  }
}

type TopRightNumericalIndicatorProps = {
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

function NumericalIndicator({ value, percent, max: maxProp }: TopRightNumericalIndicatorProps) {
  if (value === undefined) return null

  const color = colorByPercent(percent ? value : Math.min((value / maxProp) * 100, 100))
  return (
    value !== undefined &&
    (percent || value > 0) && (
      <Indicator className="numerical-indicator" backgroundColor={color}>
        {value}
        {percent ? '%' : ''}
      </Indicator>
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
