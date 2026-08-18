import { getFlagsInArrayRange } from '@openhome-core/util'
import { filterUndefined } from '@openhome-core/util/sort'
import { moveIdByBdspTmIndex, moveIdByLaTutorIndex, moveIdBySwshTrIndex } from '@pkm-rs/pkg'
import { Move, Moves } from '../moves'

export const SWSH_TR_BYTE_COUNT = 14

export function movesFromSwshTrFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, SWSH_TR_BYTE_COUNT)
    .map(moveIdBySwshTrIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export const BDSP_TM_BYTE_COUNT = 14

export function movesFromBdspTmFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, BDSP_TM_BYTE_COUNT)
    .map(moveIdByBdspTmIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export const LA_TUTOR_BYTE_COUNT = 8

export function movesFromLaTutorFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, LA_TUTOR_BYTE_COUNT)
    .map(moveIdByLaTutorIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export const SV_TM_BASE_GAME_BYTE_COUNT = 22

export function movesFromSvTmFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, SV_TM_BASE_GAME_BYTE_COUNT)
    .map(moveIdByBdspTmIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}
