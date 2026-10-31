import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier } from '@openhome-core/tauri/spectaCommands'
import { Errorable } from '@openhome-core/util/functional'
import { ConvertStrategy, OriginGame, PkmFormat } from '@pkm-rs/pkg'
import { PluginSAV, SAV } from './interfaces'
import { PathData } from './util/path'
import { TransferRestrictions } from './util/TransferRestrictions'

export interface SavePkmClass {
  fromBytes(bytes: ArrayBuffer): PKMInterface
  fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PKMInterface>
  getFormat(): PkmFormat
}

export interface SAVClass<S extends SAV = SAV> {
  new (path: PathData, bytes: Uint8Array): S
  pkmType: SavePkmClass
  fileIsSave: (bytes: Uint8Array) => boolean
  includesOrigin: (origin: OriginGame) => boolean
  lookupType?: LookupType
  saveTypeName: string
  saveTypeID: string
  saveTypeAbbreviation: string
  getPluginIdentifier?: () => string
}

export interface PluginSaveClass<S extends PluginSAV = PluginSAV> extends SAVClass<S> {
  transferRestrictions: TransferRestrictions
  getPluginIdentifier: () => PluginIdentifier
}
export type LookupType = 'gen12' | 'gen345'
