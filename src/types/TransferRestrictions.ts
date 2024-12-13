import { NationalDex } from 'pokemon-species-data'
import { BASE, BLOOD_MOON, LGE_STARTER, LGP_STARTER } from '../consts/Formes'

interface FormRestrictions {
  [dexNum: number]: number[] | undefined
}

export interface TransferRestrictions {
  // games up to USUM include all up to one number
  maxDexNum?: number
  // games LGPE and on have noncontiguous dex numbers transferable
  transferableDexNums?: number[]
  // e.g. Alolan forms in BDSP
  excludedForms?: FormRestrictions
}
export const CapPikachus: FormRestrictions = {
  [NationalDex.Pikachu]: [1, 2, 3, 4, 5, 6, 7, 9],
}

export const AlolanForms: FormRestrictions = {
  [NationalDex.Rattata]: [1],
  [NationalDex.Raticate]: [1],
  [NationalDex.Raichu]: [1],
  [NationalDex.Sandshrew]: [1],
  [NationalDex.Sandslash]: [1],
  [NationalDex.Vulpix]: [1],
  [NationalDex.Ninetales]: [1],
  [NationalDex.Diglett]: [1],
  [NationalDex.Dugtrio]: [1],
  [NationalDex.Meowth]: [1],
  [NationalDex.Persian]: [1],
  [NationalDex.Geodude]: [1],
  [NationalDex.Graveler]: [1],
  [NationalDex.Golem]: [1],
  [NationalDex.Grimer]: [1],
  [NationalDex.Muk]: [1],
  [NationalDex.Exeggutor]: [1],
  [NationalDex.Marowak]: [1],
}

export const GalarianForms: FormRestrictions = {
  [NationalDex.Meowth]: [2],
  [NationalDex.Ponyta]: [1],
  [NationalDex.Rapidash]: [1],
  [NationalDex.Slowbro]: [1],
  [NationalDex.Farfetchd]: [1],
  [NationalDex.Weezing]: [1],
  [NationalDex.MrMime]: [1],
  [NationalDex.Articuno]: [1],
  [NationalDex.Zapdos]: [1],
  [NationalDex.Moltres]: [1],
  [NationalDex.Slowking]: [2],
  [NationalDex.Corsola]: [1],
  [NationalDex.Zigzagoon]: [1],
  [NationalDex.Linoone]: [1],
  [NationalDex.Darumaka]: [1],
  [NationalDex.Darmanitan]: [2, 3],
  [NationalDex.Yamask]: [1],
  [NationalDex.Stunfisk]: [1],
}

export const HisuianForms: FormRestrictions = {
  [NationalDex.Growlithe]: [1],
  [NationalDex.Arcanine]: [1],
  [NationalDex.Voltorb]: [1],
  [NationalDex.Electrode]: [1],
  [NationalDex.Typhlosion]: [1],
  [NationalDex.Qwilfish]: [1],
  [NationalDex.Sneasel]: [1],
  [NationalDex.Samurott]: [1],
  [NationalDex.Lilligant]: [1],
  [NationalDex.Basculin]: [2],
  [NationalDex.Zorua]: [1],
  [NationalDex.Zoroark]: [1],
  [NationalDex.Braviary]: [1],
  [NationalDex.Sliggoo]: [1],
  [NationalDex.Goodra]: [1],
  [NationalDex.Avalugg]: [1],
  [NationalDex.Decidueye]: [1],
}

export const PaldeanForms: FormRestrictions = {
  [NationalDex.Tauros]: [1, 2, 3],
  [NationalDex.Wooper]: [1],
}

export const TransferLockedForms: FormRestrictions = {
  [NationalDex.Pikachu]: [LGP_STARTER],
  [NationalDex.Eevee]: [LGE_STARTER],
  [NationalDex.Kyurem]: [1, 2],
  [NationalDex.Necrozma]: [1, 2],
  [NationalDex.Calyrex]: [1, 2],
}

export const LegendsArceusExcludedForms: FormRestrictions = {
  ...AlolanForms,
  ...GalarianForms,
  [NationalDex.Vulpix]: undefined,
  [NationalDex.Ninetales]: undefined,
  [NationalDex.Growlithe]: [BASE],
  [NationalDex.Arcanine]: [BASE],
  [NationalDex.Voltorb]: [BASE],
  [NationalDex.Electrode]: [BASE],
  [NationalDex.Typhlosion]: [BASE],
  [NationalDex.Qwilfish]: [BASE],
  [NationalDex.Sneasel]: undefined,
  [NationalDex.Samurott]: [BASE],
  [NationalDex.Lilligant]: [BASE],
  [NationalDex.Basculin]: [0, 1],
  [NationalDex.Zorua]: [BASE],
  [NationalDex.Zoroark]: [BASE],
  [NationalDex.Braviary]: [BASE],
  [NationalDex.Sliggoo]: [BASE],
  [NationalDex.Goodra]: [BASE],
  [NationalDex.Avalugg]: [BASE],
  [NationalDex.Decidueye]: [BASE],
  [NationalDex.Ursaluna]: [BLOOD_MOON],
}

export const Gen89RegionalForms: FormRestrictions = {
  ...GalarianForms,
  ...HisuianForms,
  ...PaldeanForms,
}

export const RegionalForms: FormRestrictions = {
  ...Gen89RegionalForms,
  ...AlolanForms,
  // combine meowth form lists
  [NationalDex.Meowth]: [1, 2],
}

export const isRestricted = (
  restrictions: TransferRestrictions,
  dexNum: number,
  formeNum?: number
) => {
  const { maxDexNum, transferableDexNums, excludedForms } = restrictions

  if (maxDexNum && dexNum > maxDexNum) {
    return true
  }
  if (transferableDexNums && !transferableDexNums.includes(dexNum)) {
    return true
  }
  if (excludedForms && excludedForms[dexNum] && excludedForms[dexNum]?.includes(formeNum ?? 0)) {
    return true
  }
  return false
}
