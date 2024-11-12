import { AllPKMFields, Stats, ToBytesOptions } from 'pokemon-files'

export type PKMInterface = AllPKMFields & {
  isShiny(): boolean
  toBytes(options?: ToBytesOptions): ArrayBuffer
  getStats(): Stats
}
