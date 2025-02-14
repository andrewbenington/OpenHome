import { Flex, Text, Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import * as E from 'fp-ts/lib/Either'
import debounce from 'lodash/debounce'
import { useCallback, useContext, useEffect, useReducer, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import BackendInterface from 'src/backend/backendInterface'
import { TauriBackend } from 'src/backend/tauri/tauriBackend'
import useDisplayError from 'src/hooks/displayError'
import { PluginContext, pluginReducer } from 'src/state/plugin'
import { partitionResults } from 'src/util/Functional'
import { loadPlugin } from 'src/util/Plugin'
import { BackendProvider } from '../backend/backendProvider'
import useIsDarkMode from '../hooks/dark-mode'
import { AppInfoContext, appInfoInitialState, appInfoReducer, Settings } from '../state/appInfo'
import { ErrorContext, errorReducer } from '../state/error'
import { FilterContext, filterReducer } from '../state/filter'
import { LookupContext, lookupReducer } from '../state/lookup'
import { MouseContext, mouseReducer } from '../state/mouse'
import { OpenSavesContext, openSavesReducer } from '../state/openSaves'
import { HomeData } from '../types/SAVTypes/HomeData'
import './App.css'
import AppTabs from './AppTabs'
import ErrorMessageModal from './ErrorMessage'
import PokemonDragContextProvider from './PokemonDragContextProvider'

const debouncedUpdateSettings = debounce((backend: BackendInterface, settings: Settings) => {
  backend.updateSettings(settings).catch(console.error)
}, 500)

export default function App() {
  const isDarkMode = useIsDarkMode()
  const [errorState, errorDispatch] = useReducer(errorReducer, {})

  return (
    <Theme accentColor="red" hasBackground appearance={isDarkMode ? 'dark' : 'light'}>
      <BackendProvider backend={TauriBackend}>
        <ErrorContext.Provider value={[errorState, errorDispatch]}>
          <AppWithBackend />
        </ErrorContext.Provider>
      </BackendProvider>
    </Theme>
  )
}

function AppWithBackend() {
  const [mouseState, mouseDispatch] = useReducer(mouseReducer, { shift: false })
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [lookupState, lookupDispatch] = useReducer(lookupReducer, { loaded: false })
  const [filterState, filterDispatch] = useReducer(filterReducer, {})
  const [pluginState, pluginDispatch] = useReducer(pluginReducer, { plugins: [], loaded: false })
  const [loading, setLoading] = useState(false)

  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    modifiedOHPKMs: {},
    monsToRelease: [],
    openSaves: {},
  })

  // only on app start
  useEffect(() => {
    backend
      .getSettings()
      .then(
        E.match(
          async (err) => console.error(err),
          async (settings) => appInfoDispatch({ type: 'load_settings', payload: settings })
        )
      )
      .finally(() => setLoading(false))
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
        <MouseContext.Provider value={[mouseState, mouseDispatch]}>
          <LookupContext.Provider value={[lookupState, lookupDispatch]}>
            <OpenSavesContext.Provider
              value={[
                openSavesState,
                openSavesDispatch,
                Object.values(openSavesState.openSaves)
                  .filter((data) => !!data)
                  .filter((data) => !(data.save instanceof HomeData))
                  .sort((a, b) => a.index - b.index)
                  .map((data) => data.save),
              ]}
            >
              <PokemonDragContextProvider>
                <FilterContext.Provider value={[filterState, filterDispatch]}>
                  {loading ? (
                    <Flex width="100%" height="100vh" align="center" justify="center">
                      <Text size="9" weight="bold">
                        OpenHome
                      </Text>
                    </Flex>
                  ) : (
                    <AppTabs />
                  )}
                  <ErrorMessageModal />
                </FilterContext.Provider>
              </PokemonDragContextProvider>
            </OpenSavesContext.Provider>
          </LookupContext.Provider>
        </MouseContext.Provider>
      </AppInfoContext.Provider>
    </PluginContext.Provider>
  )
}
