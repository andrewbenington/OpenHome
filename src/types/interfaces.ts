import { AllPKMFields, Stats } from 'pokemon-files'
import { PK3RR } from './SAVTypes/radicalred/PK3RR'

export interface OfficialPKMInterface extends PKMInterface {
  pluginIdentifier?: undefined
  pluginOrigin?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginIdentifier: string
  pluginOrigin: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  pluginIdentifier?: string
  pluginOrigin?: string
  isLocked?: boolean
}

export type PluginPKM = PK3RR

export type PluginPKMType = typeof PK3RR
