import { AllPKMFields, Stats } from 'pokemon-files'

export interface OfficialPKMInterface extends PKMInterface {
  pluginName?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginName: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  pluginName?: string
}
