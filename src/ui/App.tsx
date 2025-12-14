import { partitionResults } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import BackendInterface from '@openhome-ui/backend/backendInterface'
import { BackendProvider } from '@openhome-ui/backend/backendProvider'
import { TauriBackend } from '@openhome-ui/backend/tauri/tauriBackend'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppStateProvider } from '@openhome-ui/state/app-state'
import {
  AppInfoContext,
  appInfoInitialState,
  appInfoReducer,
  Settings,
} from '@openhome-ui/state/appInfo'
import { DragMonContext, dragMonReducer } from '@openhome-ui/state/dragMon'
import { ErrorContext, errorReducer } from '@openhome-ui/state/error'
import { FilterContext, filterReducer } from '@openhome-ui/state/filter'
import { ItemBagContext, itemBagReducer } from '@openhome-ui/state/items'
import { MouseContext, mouseReducer } from '@openhome-ui/state/mouse'
import { OhpkmStoreProvider } from '@openhome-ui/state/ohpkm'
import { PluginContext, pluginReducer } from '@openhome-ui/state/plugin'
import { SavesProvider } from '@openhome-ui/state/saves'
import { loadPlugin } from '@openhome-ui/util/Plugin'
import { Flex, Text, Theme } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import debounce from 'lodash/debounce'
import { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import useIsDarkMode from 'src/ui/hooks/darkMode'
import './App.css'
import AppTabs from './AppTabs'
import ErrorMessageModal from './top-level/ErrorMessageModal'
import PokemonDragContextProvider from './top-level/PokemonDragContextProvider'
import UpdateMessageModal from './top-level/UpdateMessageModal'

const debouncedUpdateSettings = debounce((backend: BackendInterface, settings: Settings) => {
  backend.updateSettings(settings).catch(console.error)
}, 500)

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
  const [dragMonState, dragMonDispatch] = useReducer(dragMonReducer, { mode: 'mon' })
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [filterState, filterDispatch] = useReducer(filterReducer, {})
  const [pluginState, pluginDispatch] = useReducer(pluginReducer, { plugins: [], loaded: false })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [bagState, bagDispatch] = useReducer(itemBagReducer, {
    itemCounts: {},
    modified: false,
    loaded: false,
  })

  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  // only on app start
  useEffect(() => {
    if (appInfoState.error) {
      return
    }
    backend
      .getSettings()
      .then(
        E.match(
          async (err) => displayError('Error loading settings', err),
          async (settings) => appInfoDispatch({ type: 'load_settings', payload: settings })
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
  }, [backend, appInfoState.settings, appInfoState.settingsLoaded])

  const getEnabledSaveTypes = useCallback(() => {
    return appInfoState.extraSaveTypes
      .concat(appInfoState.officialSaveTypes)
      .filter((saveType) => appInfoState.settings.enabledSaveTypes[saveType.saveTypeID])
  }, [appInfoState])

  useEffect(() => {
    if (pluginState.loaded || !appInfoState.settingsLoaded) return
    backend.listInstalledPlugins().then(
      E.match(
        (err) => {
          pluginDispatch({ type: 'set_loaded', payload: true })
          displayError('Error Getting Installed Plugins', err)
        },
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
            <OhpkmStoreProvider>
              <ItemBagContext.Provider value={[bagState, bagDispatch]}>
                <SavesProvider>
                  <DragMonContext.Provider value={[dragMonState, dragMonDispatch]}>
                    <PokemonDragContextProvider>
                      <FilterContext.Provider value={[filterState, filterDispatch]}>
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
                      </FilterContext.Provider>
                    </PokemonDragContextProvider>
                  </DragMonContext.Provider>
                </SavesProvider>
              </ItemBagContext.Provider>
            </OhpkmStoreProvider>
          </MouseContext.Provider>
        </AppStateProvider>
      </AppInfoContext.Provider>
    </PluginContext.Provider>
  )
}
