import { PokemonData } from 'pokemon-species-data'
import { ImageResponse } from '../backend/backendInterface'
import { OpenHomePlugin } from '../state/plugin'

type PluginBuilder = (pdata: typeof PokemonData) => { plugin: OpenHomePlugin }

export function loadPlugin(pluginCode: string): OpenHomePlugin {
  // doesn't ensure isolation but should prevent direct window access
  const shadowedGlobals = Object.getOwnPropertyNames(window).filter((k) => {
    const val = window[k as keyof Window]

    return (
      k.startsWith('__') ||
      val === window ||
      (typeof val === 'object' && val && Object.values(val).some((v) => v === window))
    )
  })

  const buildPlugin = new Function(
    'PokemonData',
    ...shadowedGlobals,
    pluginCode + '; return buildPlugin;'
  ) as PluginBuilder

  const { plugin } = buildPlugin(PokemonData)

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
