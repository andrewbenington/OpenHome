import { PK3, StatsPreSplit } from 'pokemon-files'
import { isGameBoy } from 'pokemon-resources'
import { PKMInterface } from '../types/interfaces'
import { OHPKM } from '../types/pkm/OHPKM'
import { getBaseMon } from '../types/pkm/util'
import { bytesToString } from './byteLogic'
import { gen12StringToUTF, utf16StringToGen12 } from './Strings/StringConverter'

export const getMonFileIdentifier = (mon: PKMInterface) => {
  if (!('personalityValue' in mon)) {
    return undefined
  }
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)

  if (baseMon) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      mon.trainerID,
      2
    ).concat(bytesToString(mon.secretID ?? 0, 2))}-${bytesToString(
      mon.personalityValue ?? 0,
      4
    )}-${bytesToString(mon.gameOfOrigin ?? -1, 1)}`
  }
  return undefined
}

export const getMonGen12Identifier = (mon: PKMInterface & { dvs: StatsPreSplit }) => {
  const { dvs } = mon
  const convertedTrainerName = gen12StringToUTF(utf16StringToGen12(mon.trainerName, 8, true), 0, 8)
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)
  let tid = mon.trainerID

  if (mon instanceof OHPKM && !isGameBoy(mon.gameOfOrigin)) {
    tid = mon.personalityValue % 0x10000
  }
  if (baseMon && dvs) {
    return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
      tid,
      2
    )}-${convertedTrainerName}-${dvs.atk.toString(16)}-${dvs.def.toString(16)}-${dvs.spc.toString(
      16
    )}-${dvs.spe.toString(16)}`
  }
  return undefined
}

export const getMonGen345Identifier = (mon: PKMInterface) => {
  // if (!hasGen3OnData(mon)) {
  //   return undefined
  // }
  const baseMon = getBaseMon(mon.dexNum, mon.formeNum)

  try {
    const pk3 = new PK3(new OHPKM(mon))

    if (baseMon) {
      return `${baseMon.dexNumber.toString().padStart(4, '0')}-${bytesToString(
        pk3.trainerID,
        2
      ).concat(bytesToString(pk3.secretID ?? 0, 2))}-${bytesToString(pk3.personalityValue!, 4)}`
    }
  } catch (error) {
    console.error(error)
  }
  return undefined
}
