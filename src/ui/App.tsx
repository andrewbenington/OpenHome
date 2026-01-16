import { partitionResults, R } from '@openhome-core/util/functional'
import '@openhome-ui/App.css'
import AppTabs from '@openhome-ui/AppTabs'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import BackendInterface from '@openhome-ui/backend/backendInterface'
import { BackendProvider } from '@openhome-ui/backend/backendProvider'
import { TauriBackend } from '@openhome-ui/backend/tauri/tauriBackend'
import useIsDarkMode from '@openhome-ui/hooks/darkMode'
import useDisplayError from '@openhome-ui/hooks/displayError'
import useDebounce from '@openhome-ui/hooks/useDebounce'
import { AppStateProvider } from '@openhome-ui/state/app-state'
import {
  AppInfoContext,
  appInfoInitialState,
  appInfoReducer,
  Settings,
} from '@openhome-ui/state/appInfo'
import { DragMonContext, DragMonState, emptyDragState } from '@openhome-ui/state/drag-and-drop'
import PokemonDndContext from '@openhome-ui/state/drag-and-drop/PokemonDndContext'
import { ErrorContext, errorReducer } from '@openhome-ui/state/error'
import { ItemBagContext, itemBagReducer } from '@openhome-ui/state/items'
import { LookupsProvider } from '@openhome-ui/state/lookups'
import { MouseContext, mouseReducer } from '@openhome-ui/state/mouse'
import { OhpkmStoreProvider } from '@openhome-ui/state/ohpkm'
import { PluginContext, pluginReducer } from '@openhome-ui/state/plugin'
import { SavesProvider } from '@openhome-ui/state/saves'
import ErrorMessageModal from '@openhome-ui/top-level/ErrorMessageModal'
import UpdateMessageModal from '@openhome-ui/top-level/UpdateMessageModal'
import { loadPlugin } from '@openhome-ui/util/plugin'
import { Flex, Text, Theme } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useReducer, useState } from 'react'

export default function App() {
  const isDarkMode = useIsDarkMode()
  const [errorState, errorDispatch] = useReducer(errorReducer, {})

  return (
    <Theme
      accentColor="red"
      appearance={isDarkMode ? 'dark' : 'light'}
      style={{ background: 'var(--background-gradient)' }}
    >
      <BackendProvider backend={TauriBackend}>
        <ErrorContext.Provider value={[errorState, errorDispatch]}>
          <AppWithBackend />
        </ErrorContext.Provider>
      </BackendProvider>
    </Theme>
  )
}

function buildKeyboardHandler(backend: BackendInterface) {
  return (e: KeyboardEvent) => {
    if (!e.ctrlKey) return
    switch (e.key) {
      case 'o':
        backend.emitMenuEvent('open')
        return
      case 's':
        backend.emitMenuEvent('save')
        return
      case 't':
        backend.emitMenuEvent('reset')
        return
      case 'd':
        backend.emitMenuEvent('open-appdata')
        return
      case 'q':
        backend.emitMenuEvent('exit')
        return
      case 'u':
        backend.emitMenuEvent('check-updates')
        return
      case 'g':
        backend.emitMenuEvent('visit-github')
        return
    }
  }
}

function AppWithBackend() {
  const [mouseState, mouseDispatch] = useReducer(mouseReducer, { shift: false })
  const [dragState, setDragState] = useState<DragMonState>(emptyDragState())
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [pluginState, pluginDispatch] = useReducer(pluginReducer, { plugins: [], loaded: false })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [bagState, bagDispatch] = useReducer(itemBagReducer, {
    itemCounts: {},
    modified: false,
    loaded: false,
  })

  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const debouncedUpdateSettings = useDebounce((backend: BackendInterface, settings: Settings) => {
    backend.updateSettings(settings).catch(console.error)
  }, 500)

  // only on app start
  useEffect(() => {
    if (appInfoState.error) {
      return
    }
    backend
      .getSettings()
      .then(
        R.match(
          async (settings) => appInfoDispatch({ type: 'load_settings', payload: settings }),
          async (err) => displayError('Error loading settings', err)
        )
      )
      .finally(() => setSettingsLoading(false))
  }, [appInfoState.error, backend, displayError])

  // only on app start
  useEffect(() => {
    if (backend.getPlatform() !== 'windows') return
    const handler = buildKeyboardHandler(backend)

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [backend])

  useEffect(() => {
    if (!appInfoState.settingsLoaded) return
    debouncedUpdateSettings(backend, appInfoState.settings)
  }, [backend, appInfoState.settings, appInfoState.settingsLoaded, debouncedUpdateSettings])

  const getEnabledSaveTypes = useCallback(() => {
    return appInfoState.extraSaveTypes
      .concat(appInfoState.officialSaveTypes)
      .filter((saveType) => appInfoState.settings.enabledSaveTypes[saveType.saveTypeID])
  }, [appInfoState])

  useEffect(() => {
    if (pluginState.loaded || !appInfoState.settingsLoaded) return
    backend.listInstalledPlugins().then(
      R.match(
        (plugins) => {
          const promises = plugins
            .filter((plugin) => appInfoState.settings.enabledPlugins[plugin.id])
            .map((plugin) => backend.loadPluginCode(plugin.id))

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

  return (
    <PluginContext.Provider value={[pluginState, pluginDispatch]}>
      <AppInfoContext.Provider value={[appInfoState, appInfoDispatch, getEnabledSaveTypes]}>
        <AppStateProvider>
          <MouseContext.Provider value={[mouseState, mouseDispatch]}>
            <LookupsProvider>
              <OhpkmStoreProvider>
                <ItemBagContext.Provider value={[bagState, bagDispatch]}>
                  <SavesProvider>
                    <DragMonContext.Provider value={[dragState, setDragState]}>
                      <PokemonDndContext>
                        {settingsLoading ? (
                          <Flex width="100%" height="100vh" align="center" justify="center">
                            <Text size="9" weight="bold">
                              OpenHome
                            </Text>
                          </Flex>
                        ) : (
                          <AppTabs />
                        )}
                        <ErrorMessageModal />
                        <UpdateMessageModal />
                      </PokemonDndContext>
                    </DragMonContext.Provider>
                  </SavesProvider>
                </ItemBagContext.Provider>
              </OhpkmStoreProvider>
            </LookupsProvider>
          </MouseContext.Provider>
        </AppStateProvider>
      </AppInfoContext.Provider>
    </PluginContext.Provider>
  )
}
