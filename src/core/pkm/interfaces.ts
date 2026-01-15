import { FormeMetadata, SpeciesMetadata } from '@pkm-rs/pkg'
import { AllPKMFields, Stats } from '@pokemon-files/util'
import {
  COLOPKM,
  PA8,
  PB7,
  PB8,
  PK1,
  PK2,
  PK3,
  PK4,
  PK5,
  PK6,
  PK7,
  PK8,
  PK9,
  XDPKM,
} from '../../../packages/pokemon-files/src'
import PK3RR from '../save/radicalred/PK3RR'
import PK3UB from '../save/unbound/PK3UB'

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
  isFakemon?: boolean
  originalBytes?: Uint8Array
  selectColor?: string
  metadata?: FormeMetadata
  speciesMetadata?: SpeciesMetadata
}

export type OfficialPkmType =
  | PK1
  | PK2
  | PK3
  | COLOPKM
  | XDPKM
  | PK4
  | PK5
  | PK6
  | PK7
  | PB7
  | PK8
  | PA8
  | PB8
  | PK9
export type PluginPkmType = PK3RR | PK3UB
export type AnyPkmType = OfficialPkmType | PluginPkmType
