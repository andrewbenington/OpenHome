import { MetadataLookup } from '@pkm-rs-resources/pkg'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useMemo, useState } from 'react'
import { CURRENT_PLUGIN_API_VERSION } from '../app/plugins/Plugins'
import { BackendContext } from '../backend/backendContext'
import useDisplayError from '../hooks/displayError'
import { getPublicImageURL } from '../images/images'
import { getPokemonSpritePath } from '../images/pokemon'
import { MonSpriteData, OpenHomePlugin, PluginContext } from '../state/plugin'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '../types/pkm/util'

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

type SpritePlugin = RequiredFields<OpenHomePlugin, 'getMonSpritePath'>
function isSpritePlugin(plugin: OpenHomePlugin): plugin is SpritePlugin {
  return !!plugin.getMonSpritePath
}

function currentApiVersion(plugin: OpenHomePlugin) {
  return plugin.api_version >= CURRENT_PLUGIN_API_VERSION
}

type MonSpriteResult =
  | { loading: true; path?: undefined; errorMessage?: undefined; severity?: undefined }
  | { loading: false; path?: undefined; errorMessage: string; severity: 'error' | 'warning' }
  | { loading: false; path: string; errorMessage?: string; severity?: 'error' | 'warning' }

export default function useMonSprite(mon: MonSpriteData): MonSpriteResult {
  const [pluginState] = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const [spriteResult, setSpriteResult] = useState<MonSpriteResult>({ loading: true })
  const [loadError, setLoadError] = useState(false)
  const displayError = useDisplayError()

  const spritePlugins: SpritePlugin[] = useMemo(
    () => pluginState.plugins.filter(isSpritePlugin).filter(currentApiVersion),
    [pluginState.plugins]
  )

  useEffect(() => {
    setSpriteResult({ loading: true })
  }, [mon.format, mon.dexNum, mon.formeNum, mon.formArgument, mon.isFemale, mon.isShiny])

  useEffect(() => {
    if (spriteResult.errorMessage || spriteResult.path) return

    if (isMegaStone(mon.heldItemIndex)) {
      const megaForStone = MetadataLookup(mon.dexNum, mon.formeNum)?.megaEvolutions.find(
        (mega) => mega.requiredItemId === mon.heldItemIndex
      )

      if (megaForStone) mon.formeNum = megaForStone.megaForme.formeIndex
    } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
      mon.formeNum = displayIndexAdder(mon.heldItemIndex)(mon.formeNum)
    }

    for (const plugin of spritePlugins) {
      const spritePath = plugin.getMonSpritePath(mon)

      if (spritePath !== null) {
        backend.getPluginPath(plugin.id).then((pluginPath) => {
          const absolutePath = `${pluginPath}/${spritePath}`

          backend.getImageData(absolutePath).then(
            E.match(
              (err) => {
                setLoadError(true)
                console.warn(
                  'Plugin Sprite Error',
                  `Plugin '${plugin.id}' failed to load a sprite`,
                  err
                )
                setSpriteResult({
                  loading: false,
                  errorMessage: 'Failed to load plugin sprite: ' + err,
                  severity: 'error',
                })
              },
              (imageData) =>
                setSpriteResult({
                  loading: false,
                  path: `data:image/${imageData.extension};base64,${imageData.base64}`,
                })
            )
          )
        })
      }
    }

    setSpriteResult({
      loading: false,
      path: getPublicImageURL(getPokemonSpritePath(mon)),
    })
  }, [
    mon.format,
    spritePlugins,
    backend,
    loadError,
    displayError,
    spriteResult.path,
    spriteResult.errorMessage,
    spriteResult,
    mon,
  ])

  return spriteResult
}
