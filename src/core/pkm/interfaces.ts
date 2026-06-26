import { PKM, RomHackPKM } from '@openhome-core/pkm/PKM'
import { Stats } from '@openhome-core/util/types'
import { FormMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { PluginIdentifier } from '../save/interfaces'
import { AllPKMFields } from './util/pkmInterface'

// pluginIdentifier for a given plugin format is the plugin origin associated with that format. It is functionally a static field, but is an instance field to allow access from an instance of the class

// pluginOrigin is the pluginIdentifier of the save this mon was met in, if any. This is used to determine whether a mon met in a plugin save is from the same plugin or a different one.

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
  selectColor?: string
  // User-defined display color for this Pokemon in boxes (CSS color string)
  displayColor?: string
  metadata?: FormMetadata
  speciesMetadata?: SpeciesMetadata
}

type OfficialFormat = PKM['format']
export type RomHackFormat = RomHackPKM['format']
export type MonFormat = OfficialFormat | RomHackFormat

export function isRomHackFormat(format: string): format is RomHackFormat {
  return format === 'PK3RR' || format === 'PK3UB' || format === 'PB8LUMI' || format === 'PK9Compass'
}
