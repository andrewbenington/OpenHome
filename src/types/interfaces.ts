import { AllPKMFields, Stats } from '@pokemon-files/util'

export interface OfficialPKMInterface extends PKMInterface {
  pluginIdentifier?: undefined
  pluginOrigin?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginIdentifier: string
  selectColor: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  // Corresponding save's plugin_identifier
  pluginIdentifier?: string
  // If met in a plugin save, this will be the save's plugin_identifier. otherwise this is empty
  pluginOrigin?: string
  isLocked?: boolean
  originalBytes?: Uint8Array
  selectColor?: string
}
