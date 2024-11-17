import { AllPKMFields, Stats } from 'pokemon-files'

export interface OfficialPKMInterface extends PKMInterface {
  pluginIdentifier?: undefined
  pluginOrigin?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginIdentifier: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  pluginIdentifier?: string
  pluginOrigin?: string
  isLocked?: boolean
}
