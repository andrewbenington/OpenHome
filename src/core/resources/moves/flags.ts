import { getFlagsInArrayRange } from '@openhome-core/util'
import { filterUndefined } from '@openhome-core/util/sort'
import {
  moveIdByBdspTmIndex,
  moveIdByLaTutorIndex,
  moveIdByLzaBaseTmIndex,
  moveIdByLzaDlcTmIndex,
  moveIdByLzaPlusMoveIndexBlockC,
  moveIdByLzaPlusMoveIndexBlockD,
  moveIdBySvTmIndex,
  moveIdBySwshTrIndex,
} from '@pkm-rs/pkg'
import { Move, Moves } from '.'

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
    .map(moveIdBySvTmIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export const LZA_BASE_TM_BYTES = 25
export const LZA_DLC_TM_BYTES = 13
export const LZA_PLUS_MOVES_BLOCK_C_BYTES = 33
export const LZA_PLUS_MOVES_BLOCK_D_BYTES = 12

export function movesFromLzaBaseTmFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, LZA_BASE_TM_BYTES)
    .map(moveIdByLzaBaseTmIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export function movesFromLzaDlcTmFlags(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, LZA_DLC_TM_BYTES)
    .map(moveIdByLzaDlcTmIndex)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export function movesFromLzaPlusFlagsBlockC(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, LZA_PLUS_MOVES_BLOCK_C_BYTES)
    .map(moveIdByLzaPlusMoveIndexBlockC)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}

export function movesFromLzaPlusFlagsBlockD(flags: Uint8Array): Move[] {
  return getFlagsInArrayRange(flags, 0, LZA_PLUS_MOVES_BLOCK_D_BYTES)
    .map(moveIdByLzaPlusMoveIndexBlockD)
    .filter(filterUndefined)
    .map((index) => Moves[index])
}
