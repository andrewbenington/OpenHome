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

export default function AppStateDisplay() {
  const [appState, setAppState] = useState<AppState>()
  const [appInfoState] = useContext(AppInfoContext)
  const [openSavesState] = useContext(OpenSavesContext)
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
      <Card style={{ margin: 8, display: 'flex', flexDirection: 'row' }}>
        <DevDataDisplay data={appInfoState} label="App Info State" />
        <DevDataDisplay data={openSavesState} label="Saves/Mons State" />
      </Card>
    </Stack>
  )
}
