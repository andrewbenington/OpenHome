import { Option } from '../../util/functional'
import { PluginIdentifier } from '../interfaces'
import { getLumiCustomForm } from '../luminescentplatinum/conversion/LuminescentPlatinumFormMap'
import { getRadicalRedCustomForm } from '../radicalred/conversion/RadicalRedSpeciesMap'
import { getUnboundCustomForm } from '../unbound/conversion/UnboundSpeciesMap'

export function getRomHackFormName(
  pluginOrigin: PluginIdentifier,
  dexNum: number,
  pluginFormIndex: number
): Option<string> {
  switch (pluginOrigin) {
    case 'radical_red':
      return getRadicalRedCustomForm(pluginFormIndex)?.name
    case 'unbound':
      return getUnboundCustomForm(pluginFormIndex)?.name
    case 'luminescent_platinum':
      return getLumiCustomForm(dexNum, pluginFormIndex)?.name
    default:
      return undefined
  }
}
/**
 * Metadata for rom hack exclusive forms
 */

export type CustomFormInfo = {
  name: string
  fallbackForm: number // Standard form used by OpenHome for rendering compatibility
}
