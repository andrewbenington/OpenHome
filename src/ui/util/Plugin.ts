import { ImageResponse } from '@openhome-ui/backend/backendInterface'
import { OpenHomePlugin } from '@openhome-ui/state/plugin'
import { MetadataLookup, SpeciesLookup } from '@pkm-rs/pkg'
import { NationalDex } from '@pokemon-resources/consts/NationalDex'

type PluginBuilder = (
  metadataLookup: typeof MetadataLookup,
  speciesLookup: typeof SpeciesLookup,
  ndex: typeof NationalDex
) => { plugin: OpenHomePlugin }

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
    'MetadataLookup',
    'SpeciesLookup',
    'NationalDex',
    ...shadowedGlobals,
    pluginCode + '; return buildPlugin;'
  ) as PluginBuilder

  const { plugin } = buildPlugin(MetadataLookup, SpeciesLookup, NationalDex)
  return plugin
}

export interface PluginMetadata {
  id: string
  name: string
  version: string
  api_version: number
}

export interface PluginMetadataWithIcon {
  id: string
  name: string
  version: string
  api_version: number
  icon: string
  assets: Record<string, string>
  icon_image: ImageResponse | null
}
