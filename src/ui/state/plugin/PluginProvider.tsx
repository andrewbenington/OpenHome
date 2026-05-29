import {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { partitionResults, R } from 'src/core/util/functional'
import { BackendContext } from 'src/ui/backend/backendContext'
import useDisplayError from 'src/ui/hooks/displayError'
import { GITHUB_REPO, LOCAL_REPO } from 'src/ui/pages/plugins/BrowsePlugins'
import { CURRENT_PLUGIN_API_VERSION } from 'src/ui/pages/plugins/Plugins'
import { loadPlugin } from 'src/ui/util/plugin'
import { AppInfoContext } from '../appInfo'
import { OpenHomePlugin, PluginContext, pluginReducer } from './reducer'

export default function PluginsProvider({ children }: PropsWithChildren) {
  return <PluginContext value={usePlugins()}>{children}</PluginContext>
}

function usePlugins() {
  const backend = useContext(BackendContext)
  const [appInfoState] = useContext(AppInfoContext)
  const [pluginState, pluginDispatch] = useReducer(pluginReducer, { plugins: [], loaded: false })
  const displayError = useDisplayError()
  const [availablePlugins, setAvailablePlugins] = useState<Record<string, string>>()
  const [loading, setLoading] = useState(false)
  const [useDevRepo, setUseDevRepo] = useState(false)

  // TODO: refactor this to not abuse useEffect

  useEffect(() => {
    if (pluginState.loaded || !appInfoState.settingsLoaded) return
    backend.listInstalledPlugins().then(
      R.match(
        (plugins) => {
          const promises = plugins
            .filter((plugin) => appInfoState.settings.enabledPlugins[plugin.id])
            .map((plugin) => ({ ...plugin, ...backend.loadPluginCode(plugin.id) }))

          Promise.all(promises).then((results) => {
            const { failures, successes } = partitionResults(results)

            if (failures.length) {
              displayError('Some Plugins Failed to Load', failures)
            }

            const plugins = successes.map(loadPlugin)

            pluginDispatch({ type: 'register_plugins', payload: plugins })
            pluginDispatch({ type: 'set_loaded', payload: true })
          })
        },
        (err) => {
          pluginDispatch({ type: 'set_loaded', payload: true })
          displayError('Error Getting Installed Plugins', err)
        }
      )
    )
  }, [
    backend,
    displayError,
    pluginState,
    appInfoState.settingsLoaded,
    appInfoState.settings.enabledPlugins,
  ])

  useEffect(() => {
    backend.updateSettings(appInfoState.settings).catch(console.error)
  }, [appInfoState.settings, backend])

  useEffect(() => {
    setLoading(true)
    fetch(`${useDevRepo ? LOCAL_REPO : GITHUB_REPO}/plugins-v2.json`)
      .then(async (resp) => {
        setLoading(false)
        try {
          const response: { v3: Record<string, string> } = await resp.json()
          const available = response.v3

          setAvailablePlugins(available)
        } catch (e) {
          console.error(e)
          setAvailablePlugins({})
          displayError('Error Finding Available Plugins', `${e}`)
        }
      })
      .finally(() => {
        pluginDispatch({ type: 'set_loaded', payload: true })
        setLoading(false)
      })
  }, [displayError, useDevRepo, pluginDispatch])

  const loadInstalled = useCallback(
    async () =>
      backend.listInstalledPlugins().then(
        R.match(
          (plugins) => {
            const promises = plugins.map((plugin) => backend.loadPluginCode(plugin.id))

            const metadataById = Object.groupBy(plugins, (p) => p.id)

            Promise.all(promises).then((results) => {
              const { failures, successes } = partitionResults(results)

              if (failures.length) {
                displayError('Some Plugins Failed to Load', failures)
              }

              const plugins: OpenHomePlugin[] = successes
                .map(loadPlugin)
                .map((loaded) => ({ ...metadataById[loaded.id]?.[0], ...loaded }))

              pluginDispatch({ type: 'register_plugins', payload: plugins })
              pluginDispatch({ type: 'set_loaded', payload: true })
            })
          },
          (err) => {
            pluginDispatch({ type: 'set_loaded', payload: true })
            displayError('Error Getting Installed Plugins', err)
          }
        )
      ),
    [backend, displayError]
  )

  useEffect(() => {
    if (pluginState.plugins && pluginState.loaded) return
    loadInstalled()
  }, [loadInstalled, pluginState.loaded, pluginState.plugins])

  function currentApiVersion(plugin: OpenHomePlugin) {
    return plugin.api_version >= CURRENT_PLUGIN_API_VERSION
  }

  const enabledPlugins = pluginState.plugins.filter(
    (plugin) => appInfoState.settings.enabledPlugins[plugin.id] && currentApiVersion(plugin)
  )

  const outdatedPluginCount = useMemo(
    () => pluginState.plugins?.filter((p) => p.api_version < CURRENT_PLUGIN_API_VERSION).length,
    [pluginState.plugins]
  )

  function registerPlugin(plugin: OpenHomePlugin) {
    pluginDispatch({ type: 'register_plugin', payload: plugin })
  }

  function deletePlugin(pluginID: string) {
    pluginDispatch({ type: 'remove_plugin', payload: pluginID })
    loadInstalled()
  }

  return {
    installedPlugins: pluginState.plugins,
    enabledPlugins,
    setAvailablePlugins,
    availablePlugins,
    loading,
    useDevRepo,
    setUseDevRepo,
    loadInstalled,
    outdatedPluginCount,
    registerPlugin,
    deletePlugin,
  }
}

export type PluginState = ReturnType<typeof usePlugins>
