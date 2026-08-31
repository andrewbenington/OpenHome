import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKM, PkmClass } from '@openhome-core/pkm/PKM'
import { Moves } from '@openhome-core/resources'
import { filterUndefined } from '@openhome-core/util/sort'
import {
  Generation,
  MetadataSummaryLookup,
  OriginGame,
  OriginGames,
  PkmFormat,
  PkmFormats,
} from '@pkm-rs/pkg'
import { AllPKMFields } from '../pkm/util/pkmInterface'
import { FourMoves } from './types'

export function getDisplayID(pokemon: PKM): string {
  if (
    !('gameOfOrigin' in pokemon) ||
    OriginGames.generation(pokemon.gameOfOrigin) === Generation.G1 ||
    OriginGames.generation(pokemon.gameOfOrigin) === Generation.G2 ||
    pokemon.gameOfOrigin < OriginGame.Sun
  ) {
    return pokemon.trainerID.toString().padStart(5, '0')
  }

  const fullTrainerID = (BigInt(pokemon.secretID) << BigInt(16)) | BigInt(pokemon.trainerID)

  return (fullTrainerID % BigInt(1000000)).toString().padStart(6, '0')
}

export function generatePersonalityValuePreservingAttributes(mon: PKMInterface): number {
  return OHPKM.fromMonUnknownSave(mon).generatePk3CompatiblePid()
}

const getMoveMaxPP = (moveIndex: number, format: string, ppUps = 0) => {
  const move = Moves[moveIndex]

  if (!move) return undefined
  let baseMaxPP

  switch (format) {
    case 'PK1':
      baseMaxPP = move.pastGenPP?.G1 ?? move.pp
      break
    case 'PK2':
      baseMaxPP = move.pastGenPP?.G2 ?? move.pp
      break
    case 'PK3':
    case 'COLOPKM':
    case 'XDPKM':
      baseMaxPP = move.pastGenPP?.G3 ?? move.pp
      break
    case 'PK4':
      baseMaxPP = move.pastGenPP?.G4 ?? move.pp
      break
    case 'PK5':
      baseMaxPP = move.pastGenPP?.G5 ?? move.pp
      break
    case 'PK6':
      baseMaxPP = move.pastGenPP?.G6 ?? move.pp
      break
    case 'PK7':
      baseMaxPP = move.pastGenPP?.SMUSUM ?? move.pp
      break
    case 'PB7':
      baseMaxPP = move.pastGenPP?.LGPE ?? move.pp
      break
    case 'PK8':
    case 'PB8':
      baseMaxPP = move.pastGenPP?.G8 ?? move.pp
      break
    case 'PA8':
      baseMaxPP = move.pastGenPP?.LA ?? move.pp
      break
    case 'PK9':
      baseMaxPP = move.pp
      break
    default:
      baseMaxPP = move.pp
      break
  }

  if (baseMaxPP === 1) {
    return baseMaxPP
  }

  // gameboy games add less pp for 40pp moves
  if ((format === 'PK1' || format === 'PK2') && baseMaxPP === 40) {
    return baseMaxPP + Math.floor(ppUps * 7)
  }

  return baseMaxPP + Math.floor(ppUps * (baseMaxPP / 5))
}

function adjustPpForFormat(
  sourceFormat: string,
  moves: FourMoves,
  currentPp: FourMoves,
  ppUps: FourMoves,
  destFormat: string,
  destFormatNoPpUps: boolean = false
) {
  return moves.map((move, i) => {
    const otherMaxPP = getMoveMaxPP(move, sourceFormat, ppUps[i]) ?? 0
    const thisMaxPP = getMoveMaxPP(move, destFormat, destFormatNoPpUps ? 0 : ppUps[i]) ?? 0
    const adjustedMovePP = currentPp[i] - (otherMaxPP - thisMaxPP)

    return adjustedMovePP > 0 ? adjustedMovePP : 0
  }) as FourMoves
}

type AllowedMoveIndices = number[]

type PkmClassWithMoveLimit<P extends PKMInterface> = PkmClass<P> & { maxValidMove: () => number }

export class MoveFilter<P extends PKMInterface> {
  filter: AllowedMoveIndices | PkmClassWithMoveLimit<P>
  format: PkmFormat

  private constructor(filter: AllowedMoveIndices | PkmClassWithMoveLimit<P>, format: PkmFormat) {
    this.filter = filter
    this.format = format
  }

  static fromMoveIndices(filter: AllowedMoveIndices, format: PkmFormat) {
    return new MoveFilter(filter, format)
  }

  static fromPkmClass<P extends PKMInterface>(filter: PkmClassWithMoveLimit<P>) {
    return new MoveFilter(filter, filter.getFormat())
  }

  moveIsAllowed(moveIndex: number) {
    return Array.isArray(this.filter)
      ? this.filter.includes(moveIndex)
      : moveIndex <= this.filter.maxValidMove()
  }

  private filterByMoves(mon: AllPKMFields, toFilter: FourMoves): FourMoves {
    const filtered = mon.moves
      .map((move, i) => (this.moveIsAllowed(move) ? toFilter[i] : undefined))
      .filter(filterUndefined)

    return [filtered[0] ?? 0, filtered[1] ?? 0, filtered[2] ?? 0, filtered[3] ?? 0]
  }

  private hasAtLeastOneAllowedMove(mon: { moves: FourMoves }) {
    return mon.moves.some((move) => this.moveIsAllowed(move))
  }

  private filteredMovesOrLevelupIfEmpty(mon: AllPKMFields) {
    const filtered = this.filterByMoves(mon, mon.moves)
    if (filtered.every((move) => move === 0)) {
      const metadataSource = PkmFormats.getMetadataSource(this.format)
      const levelUpLearnset = MetadataSummaryLookup(
        mon.nationalDex,
        mon.formIndex
      )?.levelUpLearnset(metadataSource)
      if (levelUpLearnset) {
        const fromLevelup: FourMoves = [0, 0, 0, 0]
        levelUpLearnset
          .filter(
            (move) =>
              move.is_evolution || (move.level !== undefined && move.level <= mon.getLevel())
          )
          .slice(-4)
          .forEach((move, i) => {
            fromLevelup[i] = move.move_id
          })
        return fromLevelup
      }
    }
    return filtered
  }

  moves(mon: AllPKMFields) {
    return this.filteredMovesOrLevelupIfEmpty(mon)
  }

  movePp(
    mon: AllPKMFields,
    adjustForFormat: string,
    destFormatNoPpUps: boolean = false
  ): FourMoves {
    if (this.hasAtLeastOneAllowedMove(mon)) {
      const filteredMovePp = this.filterByMoves(mon, mon.movePP)
      return adjustPpForFormat(
        mon.format,
        this.filterByMoves(mon, mon.moves),
        filteredMovePp,
        mon.movePPUps,
        adjustForFormat,
        destFormatNoPpUps
      )
    }
    return this.filteredMovesOrLevelupIfEmpty(mon).map((moveIndex) =>
      getMoveMaxPP(moveIndex, adjustForFormat)
    ) as FourMoves
  }

  movePpUps(mon: AllPKMFields): FourMoves {
    if (this.hasAtLeastOneAllowedMove(mon)) {
      return this.filterByMoves(mon, mon.movePPUps)
    } else {
      return [0, 0, 0, 0]
    }
  }

  relearnMovesOrDefault(mon: AllPKMFields): FourMoves {
    return (mon.relearnMoves?.map((moveIndex) =>
      this.moveIsAllowed(moveIndex) ? moveIndex : 0
    ) ?? [0, 0, 0, 0]) as FourMoves
  }
}

export function getHeightCalculated(mon: AllPKMFields) {
  const formeMetadata = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)
  if (!formeMetadata || mon.heightScalar === undefined || !mon.heightDeviation) return 0

  const deviation = (mon.heightScalar / 255) * 0.40000004 + (1 - mon.heightDeviation)
  return formeMetadata.baseHeight * 100 * deviation
}

export function getWeightCalculated(mon: AllPKMFields) {
  const formeMetadata = MetadataSummaryLookup(mon.nationalDex, mon.formIndex)
  if (!formeMetadata || mon.weightScalar === undefined || !mon.weightDeviation) return 0

  const deviation = (mon.weightScalar / 255) * 0.40000004 + (1 - mon.weightDeviation)
  return formeMetadata.baseWeight * 10 * deviation
}

export function mapToObject<T>(m: Map<string | number, T>): Record<string, T> {
  return Object.fromEntries(Array.from(m.entries()))
}

export function runningInTest(): boolean {
  // Vitest sets the TEST environment variable.
  // Environment variables in import.meta are all inlined by Vite at build time, so the user's environment
  // will not affect this in a production build. It probably overrides variables like this at build time
  // as well but I have not verified.
  return import.meta.env.TEST
}

export function nullIfNone(value: string): string | null {
  if (!value || value.localeCompare('(none)') === 0) {
    return null
  } else {
    return value
  }
}

export function nullIfNoneInt(value: string): number | null {
  if (!value || value.localeCompare('(none)') === 0) {
    return null
  } else {
    return parseInt(value)
  }
}

// use type system to enforce exhaustiveness
export function expectExhaustive(_: never, description: string): never {
  throw Error(`unreachable called: ${description}`)
}
