import { isGameBoy } from 'pokemon-resources'
import { BasePKMData, OHPKM, PK4 } from '../types/PKMTypes'
import { getBaseMon } from '../types/PKMTypes/util'
import { Gen3OnData, hasGen3OnData } from '../types/interfaces/gen3'
import { GameBoyStats } from '../types/interfaces/stats'
import { bytesToString } from './ByteLogic'
import { gen12StringToUTF, utf16StringToGen12 } from './Strings/StringConverter'

export const getMonFileIdentifier = (mon: BasePKMData & Gen3OnData) => {
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

export const getMonGen12Identifier = (mon: BasePKMData & (GameBoyStats | OHPKM)) => {
  const { dvs } = mon
  const convertedTrainerName = gen12StringToUTF(utf16StringToGen12(mon.trainerName, 8, true), 0, 8)
  const baseMon = getBaseMon(mon.dexNum, mon.formNum)
  let tid = mon.trainerID
  if (mon instanceof OHPKM && !isGameBoy(mon.gameOfOrigin)) {
    tid = mon.personalityValue % 0x10000
  }
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      tid,
      2
    )}-${convertedTrainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(16)}-${dvs.spc.toString(
      16
    )}-${dvs.spe.toString(16)}`
  }
  return undefined
}

export const getMonGen345Identifier = (mon: BasePKMData & Gen3OnData) => {
  if (!hasGen3OnData(mon)) {
    return undefined
  }
  let pk345 = mon
  if (mon instanceof OHPKM) {
    pk345 = new PK4(undefined, undefined, mon)
  }
  const baseMon = getBaseMon(pk345.dexNum, pk345.formNum)
  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      pk345.trainerID,
      2
    ).concat(bytesToString(pk345.secretID, 2))}-${bytesToString(pk345.personalityValue!, 4)}`
  }
  return undefined
}
