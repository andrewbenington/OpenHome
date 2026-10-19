import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Move } from '@openhome-core/resources'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import * as types from '@openhome-core/util/types'
import { TopRightBadgeType } from '@openhome-ui/hooks/monDisplay'
import { BallsImageList } from '@openhome-ui/images/items'
import { Gender, HyperTraining, PlusMoveFlags, StatsPreSplit } from '@pkm-rs/pkg/pkm_rs'
import GenderIcon from '../pokemon/GenderIcon'
import Badge from './Badge'
import './Badge.css'

type TopRightBadgeProps = {
  mon: TopRightBadgeMon
  badgeType: TopRightBadgeType
}

export type TopRightBadgeMon = {
  heldItemIndex: number
  nickname: string
  pluginOrigin?: PluginIdentifier
  gameOfOrigin: number
  ball?: number

  evs?: types.Stats
  evsG12?: StatsPreSplit
  ivs?: types.Stats
  hyperTraining?: HyperTraining

  canGigantamax?: boolean
  gender?: Gender
  isAlpha?: boolean
  isNsPokemon?: boolean

  getLevel: () => number
  isShiny: () => boolean

  plusMoveFlags?: PlusMoveFlags
  tmMovesLza?: Move[]
  tmMovesSv?: Move[]
  tmMovesSVDLC?: Move[]
  trMovesSwSh?: Move[]
  tutorMovesLa?: Move[]

  pokerusByte?: number
  ribbons?: string[]

  openhomeId?: OhpkmIdentifier
}

const EV_STAT_MAX = 252
const EV_TOTAL_MAX = 508
const STAT_TYPE_COUNT = 6
const MAX_LEVEL = 100

export function TopRightBadge({ mon, badgeType }: TopRightBadgeProps) {
  switch (badgeType) {
    case 'Gender':
      return <GenderIcon gender={mon.gender} />
    case 'Level':
      return <Badge.Numeric value={mon.getLevel()} max={MAX_LEVEL} />
    case 'EVs (Total)':
      const evsTotal = Object.values(mon.evs ?? mon.evsG12 ?? {}).reduce((p, c) => p + c, 0)
      return <Badge.Numeric value={evsTotal} max={EV_TOTAL_MAX} />
    case 'EV (HP)':
      return <Badge.Numeric value={mon.evs?.hp} max={EV_STAT_MAX} />
    case 'EV (Attack)':
      return <Badge.Numeric value={mon.evs?.atk} max={EV_STAT_MAX} />
    case 'EV (Defense)':
      return <Badge.Numeric value={mon.evs?.def} max={EV_STAT_MAX} />
    case 'EV (Special Attack)':
      return <Badge.Numeric value={mon.evs?.spa} max={EV_STAT_MAX} />
    case 'EV (Special Defense)':
      return <Badge.Numeric value={mon.evs?.spd} max={EV_STAT_MAX} />
    case 'EV (Speed)':
      return <Badge.Numeric value={mon.evs?.spe} max={EV_STAT_MAX} />
    case 'IVs/DVs (Percent)':
      const ivsOrDvsPercent = mon.ivs ? getIvsPercent(mon) : hasDvs(mon) ? getDvsPercent(mon) : 0
      return <Badge.Numeric value={ivsOrDvsPercent} percent />
    case 'Perfect IVs Count':
      const perfectIvsCount = getPerfectIvsCount(mon)
      return <Badge.Numeric value={perfectIvsCount} max={STAT_TYPE_COUNT} />
    case 'Hyper Trained':
      return (
        <Badge.HyperTrain
          showIf={Object.values(mon.hyperTraining ?? {}).some((value) => value === true)}
        />
      )
    case 'Origin Game':
      return <Badge.Game originGame={mon.gameOfOrigin} plugin={mon.pluginOrigin} />
    case 'Most Recent Save':
      return mon instanceof OHPKM && <Badge.Game originGame={mon.mostRecentSaveWasm?.game} />
    case 'Ribbon Count':
      return <Badge.Numeric value={mon.ribbons?.length} max={3} /> // TODO: better handle color for ribbon count
    case 'Ball':
      return (
        mon.ball && (
          <img draggable={false} style={{ width: 24, height: 24 }} src={BallsImageList[mon.ball]} />
        )
      )
    case 'Alpha':
      return <Badge.Alpha showIf={mon.isAlpha} />
    case 'Gigantamax':
      return <Badge.Gigantamax showIf={mon.canGigantamax} />
    case 'Pokérus':
      return <Badge.Pokerus pokerusByte={mon.pokerusByte} showIf={true} />
    case 'TR Count (Sword/Shield)':
      return <Badge.Numeric value={mon.trMovesSwSh?.length} max={3} />
    case 'Tutor Moves Count (Legends Arceus)':
      return <Badge.Numeric value={mon.tutorMovesLa?.length} max={3} />
    case 'TM Count (Scarlet/Violet)':
      return <Badge.Numeric value={mon.tmMovesSv?.length} max={3} />
    case 'TM Count (Legends Z-A)':
      return <Badge.Numeric value={mon.tmMovesLza?.length} max={3} />
    case 'Plus Moves Known':
      return <Badge.Numeric value={mon.plusMoveFlags?.getMoveIds().length} max={3} />
    default:
      return null
  }
}

function hasDvs(mon: TopRightBadgeMon): mon is TopRightBadgeMon & { dvs: StatsPreSplit } {
  return (mon as any).dvs !== undefined
}

function getIvsPercent(mon: TopRightBadgeMon): number {
  const ivsTotal = Object.values(mon.ivs ?? {}).reduce((p, c) => p + c, 0)
  return Math.round((ivsTotal / (6 * 31)) * 100)
}

function getDvsPercent(mon: TopRightBadgeMon & { dvs: StatsPreSplit }): number {
  const dvsTotal = Object.values(mon.dvs).reduce((p, c) => p + c, 0)
  return Math.round((dvsTotal / (5 * 15)) * 100)
}

function getPerfectIvsCount(mon: TopRightBadgeMon): number {
  if (!mon.ivs) return 0
  return Object.values(mon.ivs).filter((iv) => iv === 31).length
}
