import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getPokemonSpritePath } from '@openhome-ui/images/pokemon'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { useContext, useEffect, useState } from 'react'
import { MonSpriteData, PluginContext } from 'src/ui/state/plugin/reducer'

type MonSpriteResult =
  | { loading: true; path?: undefined; errorMessage?: undefined; severity?: undefined }
  | { loading: false; path?: undefined; errorMessage: string; severity: 'error' | 'warning' }
  | { loading: false; path: string; errorMessage?: string; severity?: 'error' | 'warning' }

export default function useMonSprite(mon: MonSpriteData): MonSpriteResult {
  const { enabledPlugins } = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const [spriteResult, setSpriteResult] = useState<MonSpriteResult>({ loading: true })
  const [loadError, setLoadError] = useState(false)
  const displayError = useDisplayError()

  useEffect(() => {
    setSpriteResult({ loading: true })
  }, [
    mon.format,
    mon.dexNum,
    mon.formNum,
    mon.formArgument,
    mon.isFemale,
    mon.isShiny,
    mon.extraFormIndex,
  ])

  useEffect(() => {
    if (spriteResult.errorMessage || spriteResult.path) return

    if (isMegaStone(mon.heldItemIndex)) {
      const megaForStone = MetadataSummaryLookup(mon.dexNum, mon.formNum)?.megaEvolutions.find(
        (mega) => mega.requiredItemId === mon.heldItemIndex
      )

      if (megaForStone) mon.formNum = megaForStone.megaForme.formIndex
    } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
      mon.formNum = displayIndexAdder(mon.heldItemIndex)(mon.formNum)
    }

    for (const plugin of enabledPlugins) {
      const spritePath = plugin.getMonSpritePath?.(mon)

      if (spritePath) {
        backend.getPluginPath(plugin.id).then((pluginPath) => {
          const absolutePath = `${pluginPath}/${spritePath}`

          backend.getImageData(absolutePath).then(
            R.match(
              (imageData) =>
                setSpriteResult({
                  loading: false,
                  path: `data:image/${imageData.extension};base64,${imageData.base64}`,
                }),
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
              }
            )
          )
        })
        return
      }
    }

    setSpriteResult({
      loading: false,
      path: getPublicImageURL(getPokemonSpritePath(mon)),
    })
  }, [
    mon.format,
    enabledPlugins,
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
