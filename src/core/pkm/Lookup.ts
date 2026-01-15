import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { dvsFromIVs, getBaseMon } from '@openhome-core/pkm/util'
import { PKMFormeRef } from '@openhome-core/util/types'
import { MetadataLookup, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { generatePersonalityValuePreservingAttributes } from '@pokemon-files/util'
import { gen12StringToUTF, utf16StringToGen12 } from '../save/util/Strings'
import { bytesToString } from '../save/util/byteLogic'

export type OhpkmIdentifier = string

export const getMonFileIdentifier = (mon: PKMInterface): OhpkmIdentifier | undefined => {
  if (!mon.personalityValue) {
    return undefined
  }
  return getHomeIdentifier({ ...mon, personalityValue: mon.personalityValue }) // 🙄
}

type HomeIdentifierDerivableMon = {
  dexNum: number
  formeNum: number
  trainerID: number
  secretID: number
  personalityValue: number
  gameOfOrigin: OriginGame
}

export function getHomeIdentifier(mon: HomeIdentifierDerivableMon): OhpkmIdentifier {
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)

  if (!baseMon) {
    throw Error('Invalid dex number')
  }

  return `${baseMon.nationalDex.toString().padStart(4, '0')}-${bytesToString(
    mon.trainerID,
    2
  ).concat(
    bytesToString(mon.secretID ?? 0, 2)
  )}-${bytesToString(mon.personalityValue ?? 0, 4)}-${bytesToString(mon.gameOfOrigin ?? -1, 1)}`
}

export const getMonGen12Identifier = (mon: PKMInterface) => {
  let { dvs, ivs } = mon
  if (!dvs) {
    if (!ivs) return undefined
    dvs = dvsFromIVs(ivs, mon.isShiny())
  }

  const convertedTrainerName = gen12StringToUTF(utf16StringToGen12(mon.trainerName, 8, true), 0, 8)
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)
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

export const getMonGen345Identifier = (mon: PKMInterface) => {
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)

  try {
    const ohpkm = new OHPKM(mon)
    let pk3CompatiblePID

    if (mon instanceof OHPKM) {
      // Get the personality value that will be generated
      pk3CompatiblePID = generatePersonalityValuePreservingAttributes(mon)
    } else if (mon.personalityValue) {
      pk3CompatiblePID = mon.personalityValue
    } else {
      return undefined
    }

    const trainerId = ohpkm.trainerID
    const secretId = ohpkm.secretID

    if (baseMon) {
      return `${baseMon.nationalDex.toString().padStart(4, '0')}-${bytesToString(
        trainerId,
        2
      ).concat(bytesToString(secretId, 2))}-${bytesToString(pk3CompatiblePID, 4)}`
    }
  } catch (error) {
    console.error(error)
  }
  return undefined
}

export function isEvolution(prevo: PKMFormeRef, possibleEvo: PKMFormeRef): boolean {
  const prevoForme = MetadataLookup(prevo.dexNum, prevo.formeNum)
  const possibleEvoForme = MetadataLookup(possibleEvo.dexNum, possibleEvo.formeNum)

  if (!prevoForme || !possibleEvoForme) return false

  if (
    prevoForme.evolutions.some(
      (evo) => evo.nationalDex === possibleEvo.dexNum && evo.formeIndex === possibleEvo.formeNum
    )
  ) {
    return true
  }

  for (const evo of prevoForme.evolutions) {
    if (isEvolution(prevo, { dexNum: evo.nationalDex, formeNum: evo.formeIndex })) {
      return true
    }
  }

  return false
}
