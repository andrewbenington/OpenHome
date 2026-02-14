import { StatsPreSplit } from '@pokemon-files/util'
import { OHPKM } from 'src/core/pkm/OHPKM'
import { PKMInterface } from '../../../../core/pkm/interfaces'
import { TopRightIndicatorType } from '../../../hooks/useMonDisplay'
import { getPublicImageURL } from '../../../images/images'
import { BallsImageList } from '../../../images/items'
import GenderIcon from '../GenderIcon'
import { ImageIndicator } from './ImageIndicator'
import { Indicator } from './Indicator'
import { OriginGameIndicator } from './OriginGame'
import './style.css'

type TopRightIndicatorProps = {
  mon: PKMInterface
  indicatorType: TopRightIndicatorType
}

export function TopRightIndicator({ mon, indicatorType }: TopRightIndicatorProps) {
  switch (indicatorType) {
    case 'Gender':
      return <GenderIcon gender={mon.gender} />
    case 'EVs (Total)':
      const evsTotal = Object.values(mon.evs ?? mon.evsG12 ?? {}).reduce((p, c) => p + c, 0)
      return <TopRightNumericalIndicator value={evsTotal} />
    case 'EV (HP)':
      return <TopRightNumericalIndicator value={mon.evs?.hp} />
    case 'EV (Attack)':
      return <TopRightNumericalIndicator value={mon.evs?.atk} />
    case 'EV (Defense)':
      return <TopRightNumericalIndicator value={mon.evs?.def} />
    case 'EV (Special Attack)':
      return <TopRightNumericalIndicator value={mon.evs?.spa} />
    case 'EV (Special Defense)':
      return <TopRightNumericalIndicator value={mon.evs?.spd} />
    case 'EV (Speed)':
      return <TopRightNumericalIndicator value={mon.evs?.spe} />
    case 'IVs/DVs (Percent)':
      const ivsOrDvsPercent = mon.ivs ? getIvsPercent(mon) : hasDvs(mon) ? getDvsPercent(mon) : 0
      return <TopRightNumericalIndicator value={ivsOrDvsPercent} percent />
    case 'Perfect IVs Count':
      const perfectIvsCount = getPerfectIvsCount(mon)
      return <TopRightNumericalIndicator value={perfectIvsCount} />
    case 'Origin Game':
      return <OriginGameIndicator originGame={mon.gameOfOrigin} plugin={mon.pluginOrigin} />
    case 'Most Recent Save':
      return (
        mon instanceof OHPKM && <OriginGameIndicator originGame={mon.mostRecentSaveWasm?.game} />
      )
    case 'Ribbon Count':
      return <TopRightNumericalIndicator value={mon.ribbons?.length} />
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
}

function hasDvs(mon: PKMInterface): mon is PKMInterface & { dvs: StatsPreSplit } {
  return (mon as any).dvs !== undefined
}

function TopRightNumericalIndicator({ value, percent }: TopRightNumericalIndicatorProps) {
  return (
    value !== undefined &&
    (percent || value > 0) && (
      <Indicator className="numerical-indicator" backgroundColor="#e60040">
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
