import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { OriginGame } from '@pkm-rs/pkg'
import { SAV } from '../interfaces'
import { PathData } from './path'

export const SIZE_SM = 0x6be00
export const SIZE_USUM = 0x6cc00
export type LOOKUP_TYPE = 'gen12' | 'gen345'

export const DESAMUME_FOOTER_START =
  '|<--Snip above here to create a raw sav by excluding this DeSmuME savedata footer:'

export interface SavePkmClass {
  new (arg: ArrayBuffer | PKMInterface, encrypted?: boolean): PKMInterface
  fromBytes(bytes: ArrayBuffer): PKMInterface
  getName(): string
}

export type AnyPkmClass = SavePkmClass | typeof OHPKM

export interface SAVClass {
  new (path: PathData, bytes: Uint8Array): SAV
  pkmType: SavePkmClass
  fileIsSave: (bytes: Uint8Array) => boolean
  includesOrigin: (origin: OriginGame) => boolean
  lookupType?: 'gen12' | 'gen345'
  saveTypeName: string
  saveTypeID: string
  saveTypeAbbreviation: string
  getPluginIdentifier?: () => string
}

export type PKMTypeOf<Type> = Type extends SAV<infer X> ? X : never

export function supportsMon(saveType: SAVClass, dexNumber: number, formeNumber: number): boolean {
  return saveType.prototype.supportsMon(dexNumber, formeNumber)
}

export function getPluginIdentifier(saveType: SAVClass | undefined): string | undefined {
  return saveType?.getPluginIdentifier?.()
}

export function hasDesamumeFooter(bytes: Uint8Array, expectedOffset: number): boolean {
  const possibleFooter = new TextDecoder().decode(bytes.slice(expectedOffset))

  return possibleFooter.startsWith(DESAMUME_FOOTER_START)
}
