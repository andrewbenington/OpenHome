import { SpeciesLookup } from '@pokemon-resources/pkg'
import { Card, Flex, Heading, Separator } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { GameOfOriginData } from 'pokemon-resources'
import { useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { AppState } from 'src/backend/backendInterface'
import { DevDataDisplay } from 'src/components/DevDataDisplay'
import { InfoGrid } from 'src/components/InfoGrid2'
import useDisplayError from 'src/hooks/displayError'
import { AppInfoContext, AppInfoState } from 'src/state/appInfo'
import { OpenSavesContext, OpenSavesState } from 'src/state/openSaves'
import { PKMInterface } from 'src/types/interfaces'
import { ErrorContext } from '../../state/error'

export default function AppStateDisplay() {
  const [appState, setAppState] = useState<AppState>()
  const [appInfoState] = useContext(AppInfoContext)
  const [openSavesState] = useContext(OpenSavesContext)
  const [errorState, dispatchErrorState] = useContext(ErrorContext)
  const backend = useContext(BackendContext)
  const [error, setError] = useState<string>()
  const displayError = useDisplayError()

  useEffect(() => {
    if (error) return
    backend.getState().then(
      E.match(
        (err) => {
          setError(err)
          displayError('Error Getting App State', err)
        },
        (state) => setAppState(state)
      )
    )
  }, [backend, displayError, error])

  return (
    <Flex direction="column">
      <Card style={{ margin: 8 }}>
        <Flex direction="column" gap="2">
          <Heading size="4">Backend App State</Heading>
          <Separator style={{ width: '100%', color: 'inherit' }} />
          <InfoGrid data={appState ?? {}} />
        </Flex>
      </Card>
      <Card style={{ margin: 8, display: 'flex', flexDirection: 'row', gap: 8 }}>
        <DevDataDisplay data={appInfoDisplay(appInfoState)} label="App Info State" />
        <DevDataDisplay data={openSavesDisplay(openSavesState)} label="Saves/Mons State" />
        <DevDataDisplay data={errorState} label="Error State" />
        <button
          onClick={() =>
            dispatchErrorState({
              type: 'set_message',
              payload: { title: 'Test Error Title', messages: ['Message 1', 'Message 2'] },
            })
          }
        >
          Test Error
        </button>
      </Card>
    </Flex>
  )
}

function appInfoDisplay(state: AppInfoState) {
  return {
    settings: state.settings,
    officialSaveTypes: state.officialSaveTypes.map((saveType) => saveType.name),
  }
}

function openSavesDisplay(state: OpenSavesState) {
  return {
    'Modified Mons': Object.fromEntries(
      Object.entries(state.modifiedOHPKMs).map(([key, val]) => [key, monDisplay(val)])
    ),
    'Home Data': state.homeData?.displayState(),
    Banks: state.homeData?.banks.map((bank) => ({
      name: bank.name,
      index: bank.index,
      boxes: bank.boxes,
    })),
    Error: state.error,
  }
}

function monDisplay(mon: PKMInterface) {
  const species = SpeciesLookup(mon.dexNum)

  return {
    species: species?.name,
    forme: species?.formes[mon.formeNum ?? 0].formeName,
    nickname: mon.nickname,
    origin: mon.gameOfOrigin ? 'Pokémon ' + GameOfOriginData[mon.gameOfOrigin]?.name : undefined,
  }
}
