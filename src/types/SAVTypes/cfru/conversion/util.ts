export interface GameToNationalDexEntry {
  NationalDexIndex: number
  FormIndex: number
}

export function makeNationalDexToGameMap(
  GameToNationalDexMap: Record<string, GameToNationalDexEntry | null>
) {
  const NationalDexToGameMap: Record<string, string> = {}

  for (const key in GameToNationalDexMap) {
    const entry = GameToNationalDexMap[key]
    if (entry) {
      const newKey = `${entry.NationalDexIndex}_${entry.FormIndex}`

      if (entry.NationalDexIndex === -1) continue

      if (!(newKey in NationalDexToGameMap)) {
        NationalDexToGameMap[newKey] = key
      }
    }
  }
  return NationalDexToGameMap
}

export function fromGen3CRFUPokemonIndex(
  radicalRedIndex: number,
  GameToNationalDexMap: Record<string, GameToNationalDexEntry | null>
): GameToNationalDexEntry {
  const entry = GameToNationalDexMap[String(radicalRedIndex)]

  if (entry) {
    return {
      NationalDexIndex: entry.NationalDexIndex,
      FormIndex: entry.FormIndex,
    }
  } else {
    throw new Error(`Radical Red index ${radicalRedIndex} not found.`)
  }
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
