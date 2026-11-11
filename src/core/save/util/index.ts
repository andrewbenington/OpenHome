import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { PkmFormSpecifiers } from '@openhome-core/pkm/util/pkmInterface'
import { ExtraFormIndex } from '@pkm-rs/pkg'
import { SAV } from '../interfaces'
import { SAVClass } from '../types'

const DESMUME_FOOTER_START =
  '|<--Snip above here to create a raw sav by excluding this DeSmuME savedata footer:'

export function supportsMon(
  saveType: SAVClass,
  nationalDex: number,
  formNumber: number,
  extraFormIndex?: ExtraFormIndex
): boolean {
  return saveType.prototype.supportsMon(nationalDex, formNumber, extraFormIndex)
}

export function monSupportedBySaveType(
  saveType: SAVClass | undefined,
  mon?: PKMInterface
): boolean {
  if (!saveType || !mon) return false
  return supportsMon(saveType, mon.nationalDex, mon.formIndex, mon.extraFormIndex)
}

export function monSupportedBySave(save?: SAV, mon?: PkmFormSpecifiers): boolean {
  if (!save || !mon) return false
  return save.supportsMon(mon.nationalDex, mon.formIndex, mon.extraFormIndex)
}

export function getPluginIdentifier(saveType: SAVClass | undefined): string | undefined {
  return saveType?.getPluginIdentifier?.()
}

export function hasDesmumeFooter(bytes: Uint8Array, expectedOffset: number): boolean {
  const possibleFooter = new TextDecoder().decode(bytes.slice(expectedOffset))

  return possibleFooter.startsWith(DESMUME_FOOTER_START)
}
