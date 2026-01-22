import { OriginGames } from '@pkm-rs/pkg'
import { StatsPreSplit } from '@pokemon-files/util'
import { Badge, Tooltip } from '@radix-ui/themes'
import { OHPKM } from 'src/core/pkm/OHPKM'
import { PKMInterface } from '../../core/pkm/interfaces'
import GenderIcon from '../components/pokemon/GenderIcon'
import { TopRightIndicatorType } from '../hooks/useMonDisplay'
import { getOriginIconPath } from '../images/game'
import { getPublicImageURL } from '../images/images'
import { BallsImageList } from '../images/items'
import { colorIsDark } from '../util/color'
import './style.css'

type TopRightIndicatorProps = {
  mon: PKMInterface
  indicatorType: TopRightIndicatorType
}

export default function TopRightIndicator({ mon, indicatorType }: TopRightIndicatorProps) {
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
      return <OriginGameIndicator originGame={mon.gameOfOrigin} />
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
          <IndicatorBadge
            description="Alpha"
            src={getPublicImageURL('icons/Alpha.png')}
            backgroundColor="#f2352d"
          />
        )
      )
    case 'Gigantamax':
      return (
        mon.canGigantamax && (
          <IndicatorBadge
            description="Gigantamax"
            src={getPublicImageURL('icons/GMax.png')}
            backgroundColor="#e60040"
          />
        )
      )
    default:
      return <></>
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
      <Badge className="badge-shadow numerical-indicator" size="1" variant="solid">
        {value}
        {percent ? '%' : ''}
      </Badge>
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

type OriginGameIndicatorProps = {
  originGame: number | undefined
}

function OriginGameIndicator({ originGame }: OriginGameIndicatorProps) {
  if (originGame === undefined) return null

  const gameMetadata = OriginGames.getMetadata(originGame)
  const markImage = getOriginIconPath(gameMetadata)
  const backgroundColor = OriginGames.color(originGame)

  if (!markImage) return null

  return (
    <IndicatorBadge
      description={gameMetadata.name}
      src={markImage}
      backgroundColor={backgroundColor}
    />
  )
}

type IndicatorBadgeProps = {
  description: string
  src: string
  backgroundColor: string
}

function IndicatorBadge({ description, src, backgroundColor }: IndicatorBadgeProps) {
  return (
    <Tooltip content={description}>
      <Badge
        className="badge-shadow origin-badge"
        size="1"
        style={{ backgroundColor }}
        variant="solid"
      >
        <img
          className={colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'}
          style={{ maxHeight: 15, maxWidth: 15 }}
          draggable={false}
          alt="origin mark"
          src={src}
        />
      </Badge>
    </Tooltip>
  )
}
