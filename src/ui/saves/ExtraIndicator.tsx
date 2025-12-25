import { OriginGames } from '@pkm-rs/pkg'
import { Badge, Tooltip } from '@radix-ui/themes'
import { PKMInterface } from '../../core/pkm/interfaces'
import GenderIcon from '../components/pokemon/GenderIcon'
import { getOriginIconPath } from '../images/game'
import { ExtraIndicatorType } from '../state/mon-display/useMonDisplay'
import { colorIsDark } from '../util/color'
import './style.css'

type ExtraIndicatorProps = {
  mon: PKMInterface
  indicatorType: ExtraIndicatorType
}

export default function ExtraIndicator({ mon, indicatorType }: ExtraIndicatorProps) {
  switch (indicatorType) {
    case 'Gender':
      return <GenderIcon gender={mon.gender} />
    case 'EVs (Total)':
      const evsTotal = Object.values(mon.evs ?? mon.evsG12 ?? {}).reduce((p, c) => p + c, 0)
      return <ExtraIndicatorNumerical value={evsTotal} />
    case 'EV (HP)':
      return <ExtraIndicatorNumerical value={mon.evs?.hp} />
    case 'EV (Attack)':
      return <ExtraIndicatorNumerical value={mon.evs?.atk} />
    case 'EV (Defense)':
      return <ExtraIndicatorNumerical value={mon.evs?.def} />
    case 'EV (Special Attack)':
      return <ExtraIndicatorNumerical value={mon.evs?.spa} />
    case 'EV (Special Defense)':
      return <ExtraIndicatorNumerical value={mon.evs?.spd} />
    case 'EV (Speed)':
      return <ExtraIndicatorNumerical value={mon.evs?.spe} />
    case 'IVs (Percent)':
      const ivsTotal = Object.values(mon.ivs ?? {}).reduce((p, c) => p + c, 0)
      const ivsPercent = Math.round((ivsTotal / (6 * 31)) * 100)
      return <ExtraIndicatorNumerical value={ivsPercent} percent />
    case 'Origin Game':
      const gameMetadata = OriginGames.getMetadata(mon.gameOfOrigin)
      const markImage = mon.gameOfOrigin ? getOriginIconPath(gameMetadata) : undefined
      const backgroundColor = OriginGames.color(mon.gameOfOrigin)
      return (
        mon.gameOfOrigin && (
          <Tooltip content={gameMetadata.name}>
            <Badge
              className="badge-shadow origin-badge"
              size="1"
              style={{ backgroundColor }}
              variant="solid"
              title={gameMetadata.name}
            >
              <img
                className={colorIsDark(backgroundColor) ? 'white-filter' : 'black-filter'}
                style={{ width: 15, height: 15 }}
                draggable={false}
                alt="origin mark"
                src={markImage}
              />
            </Badge>
          </Tooltip>
        )
      )
    default:
      return <></>
  }
}

type ExtraIndicatorNumericalProps = {
  value?: number
  percent?: boolean
}

function ExtraIndicatorNumerical({ value, percent }: ExtraIndicatorNumericalProps) {
  return (
    value !== undefined &&
    value > 0 && (
      <Badge
        size="1"
        style={{ fontWeight: 'bold', borderRadius: 32, fontSize: 10, padding: '0px 4px' }}
        variant="solid"
      >
        {value}
        {percent ? '%' : ''}
      </Badge>
    )
  )
}
