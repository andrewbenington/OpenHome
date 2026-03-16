import { FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { PKM, RomHackPKM } from '@pokemon-files/pkm/PKM'
import { AllPKMFields, Stats } from '@pokemon-files/util'
import { PluginIdentifier } from '../save/interfaces'

// pluginIdentifier for a given plugin format is the plugin origin associated with that format. It is functionally a static field, but is an instance field to allow access from an instance of the class

// pluginOrigin is the pluginIdentifier of the save this mon was met in, if any. This is used to determine whether a mon met in a plugin save is from the same plugin or a different one.

export interface OfficialPKMInterface extends PKMInterface {
  pluginIdentifier?: undefined
  pluginOrigin?: undefined
}

export interface PluginPKMInterface extends PKMInterface {
  pluginIdentifier: PluginIdentifier
  pluginOrigin?: PluginIdentifier
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
