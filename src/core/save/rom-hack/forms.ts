import { Option } from '../../util/functional'
import { PluginIdentifier } from '../interfaces'
import { getLumiCustomForm } from '../luminescentplatinum/conversion/LuminescentPlatinumFormMap'

export function getRomHackFormName(
  pluginOrigin: PluginIdentifier,
  dexNum: number,
  pluginFormIndex: number
): Option<string> {
  if (pluginOrigin === 'luminescent_platinum') {
    return getLumiCustomForm(dexNum, pluginFormIndex)?.name
  }
}
