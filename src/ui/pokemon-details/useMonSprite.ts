import { BackendContext, BackendWithHelpersInterface } from '@openhome-core/backend/backendContext'
import { displayIndexAdder, isBattleFormeItem, isMegaStone } from '@openhome-core/pkm/util'
import { Option, R } from '@openhome-core/util/functional'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getPokemonSpritePath } from '@openhome-ui/images/pokemon'
import { MonSpriteData, OpenHomePlugin, PluginContext } from '@openhome-ui/state/plugin/reducer'
import { MetadataSummaryLookup } from '@pkm-rs/pkg'
import { useContext, useEffect, useState } from 'react'

type PluginSpriteResult = {
  plugin: OpenHomePlugin
  spritePath: string
}

export function findPluginSprite(
  mon: MonSpriteData,
  enabledPlugins: OpenHomePlugin[]
): Option<PluginSpriteResult> {
  for (const plugin of enabledPlugins) {
    const spritePath = plugin.getMonSpritePath?.(mon)

    if (spritePath) {
      return { plugin, spritePath }
    }
  }
}

export type GetMonSpriteResult =
  | { type: 'default'; path: string }
  | ({ type: 'plugin' } & PluginSpriteResult)

export function getMonSprite(
  mon: MonSpriteData,
  enabledPlugins: OpenHomePlugin[]
): GetMonSpriteResult {
  if (isMegaStone(mon.heldItemIndex)) {
    const megaForStone = MetadataSummaryLookup(mon.dexNum, mon.formNum)?.megaEvolutions.find(
      (mega) => mega.requiredItemId === mon.heldItemIndex
    )

    if (megaForStone) mon.formNum = megaForStone.megaForme.formIndex
  } else if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
    mon.formNum = displayIndexAdder(mon.heldItemIndex)(mon.formNum)
  }

  const pluginResult = findPluginSprite(mon, enabledPlugins)
  if (pluginResult) {
    return { type: 'plugin', ...pluginResult }
  } else {
    return { type: 'default', path: getPublicImageURL(getPokemonSpritePath(mon)) }
  }
}

type MonSpriteResult =
  | { loading: true; path?: undefined; errorMessage?: undefined; severity?: undefined }
  | { loading: false; path?: undefined; errorMessage: string; severity: 'error' | 'warning' }
  | { loading: false; path: string; errorMessage?: string; severity?: 'error' | 'warning' }

export default function useMonSprite(mon: MonSpriteData): MonSpriteResult {
  const { enabledPlugins } = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const [spriteResult, setSpriteResult] = useState<MonSpriteResult>({ loading: true })
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

    const result = getMonSprite(mon, enabledPlugins)
    switch (result.type) {
      case 'default':
        setSpriteResult({
          loading: false,
          path: getPublicImageURL(getPokemonSpritePath(mon)),
        })
        return
      case 'plugin':
        const { plugin, spritePath } = result
        backend
          .getPluginPath(plugin.id)
          .then(
            R.asyncFlatMap((pluginPath: string) =>
              backend.getImageData(`${pluginPath}/${spritePath}`)
            )
          )
          .then(
            R.match(
              (imageData) =>
                setSpriteResult({
                  loading: false,
                  path: `data:image/${imageData.extension};base64,${imageData.base64}`,
                }),
              (err) => {
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
    }
  }, [
    mon.format,
    enabledPlugins,
    backend,
    displayError,
    spriteResult.path,
    spriteResult.errorMessage,
    spriteResult,
    mon,
  ])

  return spriteResult
}

export async function getPluginSprite(
  plugin: OpenHomePlugin,
  spritePath: string,
  backend: BackendWithHelpersInterface
): Promise<MonSpriteResult> {
  return backend
    .getPluginPath(plugin.id)
    .then(
      R.asyncFlatMap((pluginPath: string) => backend.getImageData(`${pluginPath}/${spritePath}`))
    )
    .then(
      R.match(
        (imageData) =>
          ({
            loading: false,
            path: `data:image/${imageData.extension};base64,${imageData.base64}`,
          }) as MonSpriteResult,
        (err) => {
          console.warn('Plugin Sprite Error', `Plugin '${plugin.id}' failed to load a sprite`, err)
          return {
            loading: false,
            errorMessage: 'Failed to load plugin sprite: ' + err,
            severity: 'error',
          }
        }
      )
    )
}
