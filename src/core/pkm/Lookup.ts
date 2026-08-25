import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { dvsFromIVs, getBaseEvolution } from '@openhome-core/pkm/util'
import { Option } from '@openhome-core/util/functional'
import {
  readGameBoyStringFromBytes,
  utf16StringToGen12,
} from '@openhome-core/util/stringConversion'
import { PKMFormeRef } from '@openhome-core/util/types'
import { Language, MetadataSummaryLookup, OriginGame, OriginGames } from '@pkm-rs/pkg'

export type OhpkmIdentifier = string

function hasPersonalityValue(
  mon: PKMInterface
): mon is PKMInterface & { personalityValue: number } {
  return mon.personalityValue !== undefined
}

export const getMonFileIdentifier = (mon: PKMInterface): OhpkmIdentifier | undefined => {
  if (mon instanceof OHPKM) {
    return getHomeIdentifier(mon)
  }
  if (!hasPersonalityValue(mon)) {
    return undefined
  }
  return getHomeIdentifier(mon)
}

type HomeIdentifierDerivableMon = {
  nationalDex: number
  formIndex: number
  trainerID: number
  secretID: number
  personalityValue: number
  gameOfOrigin: OriginGame
}

const bytesToString = (value: number, numBytes: number) => {
  return value.toString(16).padStart(numBytes * 2, '0')
}

function getHomeIdentifier(mon: HomeIdentifierDerivableMon): OhpkmIdentifier {
  const baseEvolution = getBaseEvolution(mon.nationalDex, mon.formIndex)

  if (!baseEvolution) {
    throw Error(`Invalid dex/form: ${mon.nationalDex} / ${mon.formIndex}`)
  }

  return `${baseEvolution.nationalDex.toString().padStart(4, '0')}-${bytesToString(
    mon.trainerID,
    2
  ).concat(
    bytesToString(mon.secretID ?? 0, 2)
  )}-${bytesToString(mon.personalityValue ?? 0, 4)}-${bytesToString(mon.gameOfOrigin ?? -1, 1)}`
}

export type Gen12Identifier = string
export const getMonGen12Identifier = (mon: PKMInterface): Option<Gen12Identifier> => {
  let { dvs, ivs } = mon
  if (!dvs) {
    if (!ivs) return undefined
    dvs = dvsFromIVs(ivs, mon.isShiny())
  }

  // round-trip the OT name through the game's own encoding so the identifier
  // matches what a Gen 1/2 save can actually store
  const encoding = mon.language === Language.Japanese ? 'Jpn' : 'Int'
  const nameLength = encoding === 'Jpn' ? 6 : 8
  const gen12Bytes = utf16StringToGen12(mon.trainerName, nameLength, true, encoding)
  const dataView = new DataView(gen12Bytes.buffer)
  const convertedTrainerName = readGameBoyStringFromBytes(dataView, 0, nameLength, encoding)
  const baseEvolution = getBaseEvolution(mon.nationalDex, mon.formIndex)
  let tid = mon.trainerID

  if (mon instanceof OHPKM && !OriginGames.isGameboy(mon.gameOfOrigin)) {
    tid = mon.personalityValue % 0x10000
  }
  if (baseEvolution && dvs) {
    return `${baseEvolution.nationalDex.toString().padStart(4, '0')}-${bytesToString(
      tid,
      2
    )}-${convertedTrainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(16)}-${dvs.spc.toString(
      16
    )}-${dvs.spe.toString(16)}`
  }
  return undefined
}

export type Gen345Identifier = string
export const getMonGen345Identifier = (
  mon: PKMInterface,
  keepOriginalPid: boolean = false
): Option<Gen345Identifier> => {
  const baseEvolution = getBaseEvolution(mon.nationalDex, mon.formIndex)

  try {
    let pk3CompatiblePID

    if (!keepOriginalPid) {
      // Get the personality value that will be generated
      if (mon instanceof OHPKM) {
        pk3CompatiblePID = mon.generatePk3CompatiblePid()
      } else {
        pk3CompatiblePID = OHPKM.fromMonUnknownSave(mon).generatePk3CompatiblePid()
      }
    } else if (mon.personalityValue !== undefined) {
      pk3CompatiblePID = mon.personalityValue
    } else {
      return undefined
    }

    const trainerId = mon.trainerID
    const secretId = mon.secretID

    if (baseEvolution) {
      return `${baseEvolution.nationalDex.toString().padStart(4, '0')}-${bytesToString(
        trainerId,
        2
      ).concat(bytesToString(secretId, 2))}-${bytesToString(pk3CompatiblePID, 4)}`
    }
  } catch (error) {
    console.error(`getMonGen345Identifier: ${error}`)
  }
  return undefined
}

export function isEvolution(prevo: PKMFormeRef, possibleEvo: PKMFormeRef): boolean {
  const prevoForme = MetadataSummaryLookup(prevo.nationalDex, prevo.formIndex)
  const possibleEvoForme = MetadataSummaryLookup(possibleEvo.nationalDex, possibleEvo.formIndex)

  if (!prevoForme || !possibleEvoForme) return false

  if (
    prevoForme.evolutions.some(
      (evo) =>
        evo.nationalDex === possibleEvo.nationalDex && evo.formIndex === possibleEvo.formIndex
    )
  ) {
    return true
  }

  for (const evo of prevoForme.evolutions) {
    if (isEvolution(prevo, { nationalDex: evo.nationalDex, formIndex: evo.formIndex })) {
      return true
    }
  }

  return false
}
