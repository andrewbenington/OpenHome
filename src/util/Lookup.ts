import { OHPKM, PK4, PKM } from '../types/PKMTypes'
import { getBaseMon } from '../types/PKMTypes/util'
import { bytesToString } from './ByteLogic'
import { gen12StringToUTF, utf16StringToGen12 } from './Strings/StringConverter'

export const getMonFileIdentifier = (mon: OHPKM) => {
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      mon.trainerID,
      2
    ).concat(bytesToString(mon.secretID, 2))}-${bytesToString(
      mon.personalityValue,
      4
    )}-${bytesToString(mon.gameOfOrigin, 1)}`
  }
  return undefined
}

export const getMonGen12Identifier = (mon: PKM) => {
  const { dvs } = mon
  const convertedTrainerName = gen12StringToUTF(
    utf16StringToGen12(mon.trainerName, 8, true),
    0,
    8
  )
  if (!dvs) return undefined
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)
  const TID =
    mon.isGameBoyOrigin || mon.personalityValue === undefined
      ? mon.trainerID
      : mon.personalityValue % 0x10000
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      TID,
      2
    )}-${convertedTrainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(
      16
    )}-${dvs.spc.toString(16)}-${dvs.spe.toString(16)}`
  }
  return undefined
}

export const getMonGen345Identifier = (mon: PKM) => {
  let pk345 = mon
  if (mon instanceof OHPKM) {
    pk345 = new PK4(mon)
  }
  const baseMon = getBaseMon(pk345.dexNum, pk345.formNum)
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      pk345.trainerID,
      2
    ).concat(bytesToString(pk345.secretID, 2))}-${bytesToString(
      pk345.personalityValue!,
      4
    )}`
  }
  return undefined
}
