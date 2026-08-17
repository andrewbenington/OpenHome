import { getFlagsInArrayRange } from '@openhome-core/util'
import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { moveIdBySwshTrIndex, swshTrIndexByMoveId } from '@pkm-rs/pkg'
import { Move, Moves } from '../moves'

export const SWSH_TR_BYTE_COUNT = 14

export function movesFromSwshTrFlags(trFlags: Uint8Array): Move[] {
  return getFlagsInArrayRange(trFlags, 0, SWSH_TR_BYTE_COUNT)
    .map(moveIdBySwshTrIndex)
    .filter(filterUndefined)
    .map((i) => Moves[i])
}

export function trIndexForMove(moveIndex: number): Option<number> {
  return swshTrIndexByMoveId(moveIndex)
}
