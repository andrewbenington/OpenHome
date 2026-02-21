import { FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { PKM, RomHackPKM } from '@pokemon-files/pkm/PKM'
import { AllPKMFields, Stats } from '@pokemon-files/util'
import { PluginIdentifier } from '../save/interfaces'

export interface OfficialPKMInterface extends PKMInterface {
  pluginIdentifier?: undefined
  pluginOrigin?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginIdentifier: PluginIdentifier
  selectColor: string
}

export type PKMInterface = AllPKMFields & {
  getStats(): Stats
  // Corresponding save's plugin_identifier
  pluginIdentifier?: PluginIdentifier
  // If met in a plugin save, this will be the save's plugin_identifier. otherwise this is empty
  pluginOrigin?: PluginIdentifier // why are there two of these??
  isFakemon?: boolean
  originalBytes?: Uint8Array
  selectColor?: string
  metadata?: FormeMetadata
  speciesMetadata?: SpeciesMetadata
}

export type MonFormat = (PKM | RomHackPKM)['format']
