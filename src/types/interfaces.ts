import { AllPKMFields, Stats } from 'pokemon-files'

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  pluginName?: undefined
}

export type PluginPKMInterface = PKMInterface & {
  pluginName: string
}
