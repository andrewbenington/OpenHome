import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ExtraFormIndex, OriginGame } from '@pkm-rs/pkg'
import { ConvertStrategy } from '../../../../packages/pokemon-files/src/conversion/settings'
import { PkmConstructorOptions } from '../../../../packages/pokemon-files/src/pkm/PKM'
import { SAV } from '../interfaces'
import { PathData } from './path'

export const SIZE_SM = 0x6be00
export const SIZE_USUM = 0x6cc00
export type LookupType = 'gen12' | 'gen345'

export const DESAMUME_FOOTER_START =
  '|<--Snip above here to create a raw sav by excluding this DeSmuME savedata footer:'

export interface SavePkmClass {
  new (arg: ArrayBuffer | OHPKM, options: PkmConstructorOptions): PKMInterface
  fromBytes(bytes: ArrayBuffer): PKMInterface
  fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PKMInterface
  getName(): string
}

export type AnyPkmClass = SavePkmClass | typeof OHPKM

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

export type PKMTypeOf<Type> = Type extends SAV<infer X> ? X : never

export function supportsMon(
  saveType: SAVClass,
  dexNumber: number,
  formeNumber: number,
  extraFormIndex?: ExtraFormIndex
): boolean {
  return saveType.prototype.supportsMon(dexNumber, formeNumber, extraFormIndex)
}

export function monSupportedBySaveType(
  saveType: SAVClass | undefined,
  mon?: PKMInterface
): boolean {
  if (!saveType || !mon) return false
  return supportsMon(saveType, mon.dexNum, mon.formeNum, mon.extraFormIndex)
}

export function monSupportedBySave(save?: SAV, mon?: PKMInterface): boolean {
  if (!save || !mon) return false
  return save.supportsMon(mon.dexNum, mon.formeNum, mon.extraFormIndex)
}

export function getPluginIdentifier(saveType: SAVClass | undefined): string | undefined {
  return saveType?.getPluginIdentifier?.()
}

export function hasDesamumeFooter(bytes: Uint8Array, expectedOffset: number): boolean {
  const possibleFooter = new TextDecoder().decode(bytes.slice(expectedOffset))

  return possibleFooter.startsWith(DESAMUME_FOOTER_START)
}
