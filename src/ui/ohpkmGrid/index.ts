import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Moves, Types } from '@openhome-core/resources'
import { Option } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import {
  BankBoxCoordinates,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { useSaves } from '@openhome-ui/state/saves'
import { OriginGames, PkmType } from '@pkm-rs/pkg'
import { useCallback } from 'react'

export type OhpkmRowData = Pick<
  OHPKM,
  | 'nationalDex'
  | 'formIndex'
  | 'openhomeId'
  | 'nickname'
  | 'mostRecentSaveWasm'
  | 'gameOfOrigin'
  | 'pluginOrigin'
  | 'trainerName'
  | 'startedTrackingTimestamp'
  | 'stats'
  | 'gender'
> & {
  type1: PkmType
  type2: Option<PkmType>
  natureName: string
  isShiny: boolean
  level: number
  move1: Option<string>
  move2: Option<string>
  move3: Option<string>
  move4: Option<string>
  originGameName: string
  ribbonCount: number
  homeLocation: Option<BankBoxCoordinates>
}

export default function useOhpkmGridData() {
  const { monsToRelease } = useSaves()
  const { findHomeLocation } = useBanksAndBoxes()

  const preloadRowData = useCallback(
    (ohpkm: OHPKM) =>
      toRowData(
        ohpkm,
        findHomeLocation,
        monsToRelease.filter((toRelease) => typeof toRelease === 'string')
      ),
    [findHomeLocation, monsToRelease]
  )

  return { preloadRowData }
}

export function toRowData(
  mon: OHPKM,
  findHomeLocation: (identifier: string) => Option<BankBoxCoordinates>,
  _releasingIds: string[]
): OhpkmRowData {
  return {
    nationalDex: mon.nationalDex,
    formIndex: mon.formIndex,
    openhomeId: mon.openhomeId,
    nickname: mon.nickname,
    mostRecentSaveWasm: mon.mostRecentSaveWasm,
    gameOfOrigin: mon.gameOfOrigin,
    originGameName: OriginGames.gameNameFull(mon.gameOfOrigin),
    pluginOrigin: mon.pluginOrigin,
    trainerName: mon.trainerName,
    startedTrackingTimestamp: mon.startedTrackingTimestamp,
    stats: mon.stats,
    type1: Types[mon.type1Index],
    type2: $O(mon.type2Index)
      .map((i) => Types[i])
      .get(),
    natureName: mon.nature.name,
    isShiny: mon.isShiny(),
    gender: mon.gender,
    level: mon.getLevel(),
    move1: mon.moves[0] ? Moves[mon.moves[0]].name : undefined,
    move2: mon.moves[1] ? Moves[mon.moves[1]].name : undefined,
    move3: mon.moves[2] ? Moves[mon.moves[2]].name : undefined,
    move4: mon.moves[3] ? Moves[mon.moves[3]].name : undefined,
    ribbonCount: mon.ribbons.length ?? 0,
    homeLocation: findHomeLocation(mon.openhomeId),
  }
}

export { default as useOhpkmColumns } from './ohpkm'
