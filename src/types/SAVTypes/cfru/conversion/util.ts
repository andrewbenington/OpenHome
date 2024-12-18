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
