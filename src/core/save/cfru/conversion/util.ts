import { ExtraFormIndex } from '@pkm-rs/pkg'

export interface CfruToNationalDexEntry {
  nationalDex: number
  formIndex: number
  extraFormIndex?: ExtraFormIndex
}

export function makeNationalDexToGameMap(
  GameToNationalDexMap: Record<string, CfruToNationalDexEntry | null>
) {
  const NationalDexToGameMap: Record<string, string> = {}

  for (const key in GameToNationalDexMap) {
    const entry = GameToNationalDexMap[key]

    if (entry) {
      const newKey = `${entry.nationalDex}_${entry.formIndex}`

      if (entry.nationalDex === -1) continue

      if (!(newKey in NationalDexToGameMap)) {
        NationalDexToGameMap[newKey] = key
      }
    }
  }
  return NationalDexToGameMap
}

export function makeExtraFormToGameMap(
  GameToNationalDexMap: Record<string, CfruToNationalDexEntry | null>
) {
  const ExtraFormToGameMap: Map<ExtraFormIndex, number> = new Map()

  for (const key in GameToNationalDexMap) {
    const entry = GameToNationalDexMap[key]

    if (entry?.extraFormIndex) {
      ExtraFormToGameMap.set(entry.extraFormIndex, parseInt(key))
    }
  }
  return ExtraFormToGameMap
}

export function fromGen3CRFUPokemonIndex(
  index: number,
  GameToNationalDexMap: Record<string, CfruToNationalDexEntry | null>,
  gameName: string
): CfruToNationalDexEntry {
  const entry = GameToNationalDexMap[String(index)]

  if (!entry) {
    throw new Error(`${gameName} index ${index} not found.`)
  }

  return entry
}

export function toGen3CRFUPokemonIndex(
  nationalDexNumber: number,
  formIndex: number,
  NationalDexToGameMap: Record<string, string>
): number {
  const key = `${nationalDexNumber}_${formIndex}`
  const gameIndex = globalThis.Number(NationalDexToGameMap[key])

  if (gameIndex !== undefined) {
    return gameIndex
  } else {
    throw new Error(
      `National Dex number ${nationalDexNumber} with form index ${formIndex} not found.`
    )
  }
}
