import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from '../backend/backendContext'
import useDisplayError from '../hooks/displayError'
import { getPublicImageURL } from '../images/images'
import { getPokemonSpritePath } from '../images/pokemon'
import { MonSpriteData, OpenHomePlugin, PluginContext } from '../state/plugin'

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

type SpritePlugin = RequiredFields<OpenHomePlugin, 'getMonSpritePath'>
function isSpritePlugin(plugin: OpenHomePlugin): plugin is SpritePlugin {
  return !!plugin.getMonSpritePath
}

export default function useMonSprite(mon: MonSpriteData) {
  const [pluginState] = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const [spritePath, setSpritePath] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const displayError = useDisplayError()

  const spritePlugins: SpritePlugin[] = useMemo(
    () => pluginState.plugins.filter(isSpritePlugin),
    [pluginState.plugins]
  )

  useEffect(() => {
    setLoadError(false)
  }, [mon])

  useEffect(() => {
    if (loadError) return
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
              },
              (imageData) =>
                setSpritePath(`data:image/${imageData.extension};base64,${imageData.base64}`)
            )
          )
        })
      }
    }

    setSpritePath(getPublicImageURL(getPokemonSpritePath(mon)))
  }, [mon, spritePlugins, backend, loadError, displayError])

  return spritePath
}
