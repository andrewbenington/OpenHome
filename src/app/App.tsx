import { closestCenter, DragOverlay, PointerSensor, useSensor } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { Box, Typography } from '@mui/joy'
import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import * as E from 'fp-ts/lib/Either'
import { debounce } from 'lodash'
import { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { createPortal } from 'react-dom'
import { BackendContext } from 'src/backend/backendContext'
import BackendInterface from 'src/backend/backendInterface'
import { TauriBackend } from 'src/backend/tauri/tauriBackend'
import useDisplayError from 'src/hooks/displayError'
import { PluginContext, pluginReducer } from 'src/state/plugin'
import { PKMInterface } from 'src/types/interfaces'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { partitionResults } from 'src/util/Functional'
import { loadPlugin } from 'src/util/Plugin'
import { BackendProvider } from '../backend/backendProvider'
import PokemonIcon from '../components/PokemonIcon'
import useIsDarkMode from '../hooks/dark-mode'
import { AppInfoContext, appInfoInitialState, appInfoReducer, Settings } from '../state/appInfo'
import { ErrorContext, errorReducer } from '../state/error'
import { FilterContext, filterReducer } from '../state/filter'
import { LookupContext, lookupReducer } from '../state/lookup'
import { MouseContext, mouseReducer } from '../state/mouse'
import { MonWithLocation, OpenSavesContext, openSavesReducer } from '../state/openSaves'
import './App.css'
import AppTabs from './AppTabs'
import ErrorMessageModal from './ErrorMessage'
import { PokemonDragContext } from './PokemonDrag'
import { components, darkTheme, lightTheme } from './Themes'

const debouncedUpdateSettings = debounce((backend: BackendInterface, settings: Settings) => {
  backend.updateSettings(settings).catch(console.error)
}, 500)

export default function App() {
  const isDarkMode = useIsDarkMode()
  const backend = TauriBackend
  const theme = useMemo(
    () =>
      extendTheme({
        colorSchemes: {
          dark: isDarkMode ? darkTheme : lightTheme,
          light: isDarkMode ? darkTheme : lightTheme,
        },
        components,
      }),
    [isDarkMode]
  )
  const [loading, setLoading] = useState(true)

  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [errorState, errorDispatch] = useReducer(errorReducer, {})

  // only on app start
  useEffect(() => {
    backend
      .getSettings()
      .then(
        E.match(
          async (err) => {
            console.error(err)
          },
          async (settings) => {
            appInfoDispatch({ type: 'load_settings', payload: settings })
          }
        )
      )
      .finally(() => setLoading(false))
  }, [backend])

  useEffect(() => {
    if (!appInfoState.settingsLoaded) return
    debouncedUpdateSettings(backend, appInfoState.settings)
  }, [backend, appInfoState.settings, appInfoState.settingsLoaded])

  return (
    <ThemeProvider theme={theme}>
      <BackendProvider backend={backend}>
        <ErrorContext.Provider value={[errorState, errorDispatch]}>
          {loading ? (
            <Box width="100%" height="100%" display="grid">
              <Typography margin="auto" fontSize={40} fontWeight="bold">
                OpenHome
              </Typography>
            </Box>
          ) : (
            <AppWithBackend />
          )}
        </ErrorContext.Provider>
      </BackendProvider>
    </ThemeProvider>
  )
}

function AppWithBackend() {
  const [mouseState, mouseDispatch] = useReducer(mouseReducer, { shift: false })
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    modifiedOHPKMs: {},
    monsToRelease: [],
    openSaves: {},
  })
  const [lookupState, lookupDispatch] = useReducer(lookupReducer, { loaded: false })
  const [filterState, filterDispatch] = useReducer(filterReducer, {})
  const [pluginState, pluginDispatch] = useReducer(pluginReducer, { plugins: [], loaded: false })

  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const [dragData, setDragData] = useState<MonWithLocation>()
  const [dragMon, setDragMon] = useState<PKMInterface>()

  const getEnabledSaveTypes = useCallback(() => {
    return appInfoState.extraSaveTypes
      .concat(appInfoState.officialSaveTypes)
      .filter((saveType) => appInfoState.settings.enabledSaveTypes[saveType.saveTypeID])
  }, [appInfoState])

  useEffect(() => {
    if (pluginState.loaded) return
    backend.listInstalledPlugins().then(
      E.match(
        (err) => displayError('Error Getting Installed Plugins', err),
        (plugins) => {
          const promises = plugins.map((plugin) => backend.loadPluginCode(plugin.id))

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
  }, [backend, displayError, pluginState])

  return (
    <PluginContext.Provider value={[pluginState, pluginDispatch]}>
      <AppInfoContext.Provider value={[appInfoState, appInfoDispatch, getEnabledSaveTypes]}>
        <MouseContext.Provider value={[mouseState, mouseDispatch]}>
          <PokemonDragContext
            collisionDetection={closestCenter}
            modifiers={[restrictToWindowEdges]}
            onDragEnd={(e) => {
              const dest = e.over?.data.current

              if (e.over?.id === 'to_release') {
                if (dragData) {
                  openSavesDispatch({
                    type: 'add_mon_to_release',
                    payload: dragData,
                  })
                }
              } else if (
                dragMon &&
                dragData &&
                dest &&
                dest.save.supportsMon(dragMon.dexNum, dragMon.formeNum)
              ) {
                openSavesDispatch({ type: 'move_mon', payload: { source: dragData, dest } })
              }

              setDragData(e.over?.data.current as MonWithLocation)
              let d = e.over?.data.current

              setDragMon(d?.save.boxes[d.box].pokemon[d.boxPos])
            }}
            onDragStart={(e) => {
              setDragData(e.active.data.current)
              setDragMon(e.active.data.current?.mon)
            }}
            sensors={[
              useSensor(PointerSensor, {
                activationConstraint: {
                  distance: 0, // Set a small distance threshold
                },
              }),
            ]}
          >
            {createPortal(
              <DragOverlay dropAnimation={{ duration: 300 }} style={{ cursor: 'grabbing' }}>
                {dragData && (
                  <PokemonIcon
                    dexNumber={dragMon?.dexNum ?? 0}
                    formeNumber={
                      dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.formeNum ?? 0
                    }
                    isShiny={dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.isShiny()}
                    heldItemIndex={
                      dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.heldItemIndex
                    }
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </DragOverlay>,
              document.body
            )}
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
                <FilterContext.Provider value={[filterState, filterDispatch]}>
                  <AppTabs />
                  <ErrorMessageModal />
                </FilterContext.Provider>
              </OpenSavesContext.Provider>
            </LookupContext.Provider>
          </PokemonDragContext>
        </MouseContext.Provider>
      </AppInfoContext.Provider>
    </PluginContext.Provider>
  )
}
