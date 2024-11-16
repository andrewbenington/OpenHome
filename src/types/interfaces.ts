import { AllPKMFields, Stats } from 'pokemon-files'
import { PK3RR } from "./SAVTypes/radicalred/PK3RR"

export interface OfficialPKMInterface extends PKMInterface {
  pluginName?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginName: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  pluginName?: string
  isLocked?: boolean
}

export type PluginPKM = 
  | PK3RR

  
export type PluginPKMType = 
  | typeof PK3RR
