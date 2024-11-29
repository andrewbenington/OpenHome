import { closestCenter, DragOverlay, PointerSensor, useSensor } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { Box, Tab, TabList, TabPanel, Tabs, Typography } from '@mui/joy'
import { extendTheme, ThemeProvider } from '@mui/joy/styles'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createPortal } from 'react-dom'
import { TauriBackend } from 'src/backend/tauriBackend'
import { PKMInterface } from 'src/types/interfaces'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { BackendProvider } from '../backend/backendProvider'
import PokemonIcon from '../components/PokemonIcon'
import useIsDarkMode from '../hooks/dark-mode'
import { AppInfoContext, appInfoInitialState, appInfoReducer } from '../state/appInfo'
import { FilterProvider } from '../state/filter'
import { LookupProvider } from '../state/lookup'
import { MouseContext, mouseReducer } from '../state/mouse'
import { MonLocation, OpenSavesContext, openSavesReducer } from '../state/openSaves'
import './App.css'
import Home from './Home'
import TrackedPokemon from './manage/TrackedPokemon'
import { PokemonDragContext } from './PokemonDrag'
import Settings from './Settings'
import SortPokemon from './sort/SortPokemon'
import { components, darkTheme, lightTheme } from './Themes'

export default function App() {
  const isDarkMode = useIsDarkMode()
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
  const [mouseState, mouseDispatch] = useReducer(mouseReducer, { shift: false })
  const [appInfoState, appInfoDispatch] = useReducer(appInfoReducer, appInfoInitialState)
  const [openSavesState, openSavesDispatch] = useReducer(openSavesReducer, {
    modifiedOHPKMs: {},
    monsToRelease: [],
    openSaves: {},
  })
  const [dragData, setDragData] = useState<MonLocation>()
  const [dragMon, setDragMon] = useState<PKMInterface>()

  const getEnabledSaveTypes = useCallback(() => {
    return appInfoState.settings.extraSaveTypes
      .concat(appInfoState.settings.officialSaveTypes)
      .filter((saveType) => appInfoState.settings.enabledSaveTypes[saveType.name])
  }, [appInfoState.settings])

  const loading = false
  useEffect(() => console.log(dragData), [dragData])

  return (
    <ThemeProvider theme={theme}>
      <BackendProvider backend={TauriBackend}>
        <AppInfoContext.Provider value={[appInfoState, appInfoDispatch, getEnabledSaveTypes]}>
          <MouseContext.Provider value={[mouseState, mouseDispatch]}>
            <PokemonDragContext
              collisionDetection={closestCenter}
              modifiers={[restrictToWindowEdges]}
              onDragEnd={(e) => {
                const source = e.active.data.current
                const dest = e.over?.data.current
                console.log(dest)
                if (
                  dragMon &&
                  source &&
                  dest &&
                  dest.save.supportsMon(dragMon.dexNum, dragMon.formeNum)
                ) {
                  openSavesDispatch({ type: 'move_mon', payload: { source, dest } })
                }
                setDragData(e.over?.data.current as MonLocation)
                let d = e.over?.data.current
                setDragMon(d?.save.boxes[d.box].pokemon[d.boxPos])
                console.log(d?.save.boxes[d.box].pokemon[d.boxPos]?.nickname)
              }}
              onDragStart={(e) => {
                setDragData(e.active.data.current)
                setDragMon(e.active.data.current?.mon)
                console.log(e.active.data.current?.mon)
              }}
              sensors={[
                useSensor(PointerSensor, {
                  activationConstraint: {
                    distance: 3, // Set a small distance threshold
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
                      isShiny={dragData.save.boxes[dragData.box].pokemon[
                        dragData.boxPos
                      ]?.isShiny()}
                      heldItemIndex={
                        dragData.save.boxes[dragData.box].pokemon[dragData.boxPos]?.heldItemIndex
                      }
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                </DragOverlay>,
                document.body
              )}
              <LookupProvider>
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
                  <FilterProvider>
                    {loading ? (
                      <Box width="100%" height="100%" display="grid">
                        <Typography margin="auto" fontSize={40} fontWeight="bold">
                          OpenHome
                        </Typography>
                      </Box>
                    ) : (
                      <Tabs
                        defaultValue="home"
                        style={{ height: '100vh', width: '100%' }}
                        color="primary"
                      >
                        <TabPanel
                          sx={{ '--Tabs-spacing': 0, height: 0 }}
                          value="home"
                          // container
                        >
                          <Home />
                        </TabPanel>
                        <TabPanel sx={{ '--Tabs-spacing': 0, height: 0 }} value="manage">
                          <TrackedPokemon />
                        </TabPanel>
                        <TabPanel
                          sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }}
                          value="sort"
                        >
                          <SortPokemon />
                        </TabPanel>
                        <TabPanel
                          sx={{ '--Tabs-spacing': 0, height: 0, overflowY: 'hidden' }}
                          value="settings"
                        >
                          <Settings />
                        </TabPanel>
                        <TabList color="primary">
                          <Tab indicatorPlacement="top" value="home" color="primary">
                            Home
                          </Tab>
                          <Tab indicatorPlacement="top" value="manage" color="primary">
                            Tracked Pokémon
                          </Tab>
                          <Tab indicatorPlacement="top" value="sort" color="primary">
                            Sort Pokémon
                          </Tab>
                          <Tab indicatorPlacement="top" value="settings" color="primary">
                            Settings
                          </Tab>
                        </TabList>
                      </Tabs>
                    )}
                  </FilterProvider>
                </OpenSavesContext.Provider>
              </LookupProvider>
            </PokemonDragContext>
          </MouseContext.Provider>
        </AppInfoContext.Provider>
      </BackendProvider>
    </ThemeProvider>
  )
}
