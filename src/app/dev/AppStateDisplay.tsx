import { Card, Stack } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useState } from 'react'
import { AppState } from 'src/backend/backendInterface'
import { BackendContext } from 'src/backend/backendProvider'
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
      <Card sx={{ margin: 1 }}>
        <InfoGrid data={appState ?? {}} />
      </Card>
      <Card>
        <DevDataDisplay data={appInfoState} label="App Info State" />
        <DevDataDisplay data={openSavesState} label="Saves/Mons State" />
      </Card>
    </Stack>
  )
}
