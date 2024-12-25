import { ImageResponse } from '../backend/backendInterface'
import { OpenHomePlugin } from '../state/plugin'

export function loadPlugin(pluginCode: string): OpenHomePlugin {
  const buildPlugin = new Function(pluginCode + '; return buildPlugin;') // Safely wrap the code
  const { plugin } = buildPlugin()

  return plugin
}

export interface PluginMetadata {
  id: string
  name: string
  icon: string
  assets: Record<string, string>
}

export interface PluginMetadataWithIcon {
  id: string
  name: string
  icon: string
  assets: Record<string, string>
  icon_image: ImageResponse | null
}
