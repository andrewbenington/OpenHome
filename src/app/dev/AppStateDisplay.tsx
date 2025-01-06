import { Stack } from '@mui/joy'
import { Card } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { AppState } from 'src/backend/backendInterface'
import { DevDataDisplay } from 'src/components/DevDataDisplay'
import { InfoGrid } from 'src/components/InfoGrid'
import { AppInfoContext } from 'src/state/appInfo'
import { OpenSavesContext } from 'src/state/openSaves'
import { ErrorContext } from '../../state/error'

export default function AppStateDisplay() {
  const [appState, setAppState] = useState<AppState>()
  const [appInfoState] = useContext(AppInfoContext)
  const [openSavesState] = useContext(OpenSavesContext)
  const [errorState, dispatchErrorState] = useContext(ErrorContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then((state) => {
      if (E.isRight(state)) {
        setAppState(state.right)
      }
    })
  })

  return (
    <Stack>
      <Card style={{ margin: 8 }}>
        <InfoGrid data={appState ?? {}} />
      </Card>
      <Card style={{ margin: 8, display: 'flex', flexDirection: 'row', gap: 8 }}>
        <DevDataDisplay data={appInfoState} label="App Info State" />
        <DevDataDisplay data={openSavesState} label="Saves/Mons State" />
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
    </Stack>
  )
}
