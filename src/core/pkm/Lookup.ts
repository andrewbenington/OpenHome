import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { dvsFromIVs, getBaseMon } from '@openhome-core/pkm/util'
import { Option } from '@openhome-core/util/functional'
import {
  readGameBoyStringFromBytes,
  utf16StringToGen12,
} from '@openhome-core/util/stringConversion'
import { PKMFormeRef } from '@openhome-core/util/types'
import { MetadataSummaryLookup, OriginGame, OriginGames } from '@pkm-rs/pkg'

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
  dexNum: number
  formNum: number
  trainerID: number
  secretID: number
  personalityValue: number
  gameOfOrigin: OriginGame
}

const bytesToString = (value: number, numBytes: number) => {
  return value.toString(16).padStart(numBytes * 2, '0')
}

function getHomeIdentifier(mon: HomeIdentifierDerivableMon): OhpkmIdentifier {
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)

  if (!baseMon) {
    throw Error(`Invalid dex/form: ${mon.dexNum} / ${mon.formNum}`)
  }

  return `${baseMon.nationalDex.toString().padStart(4, '0')}-${bytesToString(
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

  const gen12Bytes = utf16StringToGen12(mon.trainerName, 8, true)
  const dataView = new DataView(gen12Bytes.buffer)
  const convertedTrainerName = readGameBoyStringFromBytes(dataView, 0, 8)
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)
  let tid = mon.trainerID

  if (mon instanceof OHPKM && !OriginGames.isGameboy(mon.gameOfOrigin)) {
    tid = mon.personalityValue % 0x10000
  }
  if (baseMon && dvs) {
    return `${baseMon.nationalDex.toString().padStart(4, '0')}-${bytesToString(
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
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)

  try {
    let pk3CompatiblePID

    if (mon instanceof OHPKM && !keepOriginalPid) {
      // Get the personality value that will be generated
      pk3CompatiblePID = mon.generatePk3CompatiblePid()
    } else if (mon.personalityValue !== undefined) {
      pk3CompatiblePID = mon.personalityValue
    } else {
      return undefined
    }

    const trainerId = mon.trainerID
    const secretId = mon.secretID

    if (baseMon) {
      return `${baseMon.nationalDex.toString().padStart(4, '0')}-${bytesToString(
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
  const prevoForme = MetadataSummaryLookup(prevo.dexNum, prevo.formNum)
  const possibleEvoForme = MetadataSummaryLookup(possibleEvo.dexNum, possibleEvo.formNum)

  if (!prevoForme || !possibleEvoForme) return false

  if (
    prevoForme.evolutions.some(
      (evo) => evo.nationalDex === possibleEvo.dexNum && evo.formIndex === possibleEvo.formNum
    )
  ) {
    return true
  }

  for (const evo of prevoForme.evolutions) {
    if (isEvolution(prevo, { dexNum: evo.nationalDex, formNum: evo.formIndex })) {
      return true
    }
  }

  return false
}
