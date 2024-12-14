import { Card } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useState } from 'react'
import { AppState } from 'src/backend/backendInterface'
import { BackendContext } from '../backend/backendProvider'
import { InfoGrid } from '../components/InfoGrid'

export default function AppStateDisplay() {
  const [appState, setAppState] = useState<AppState>()
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.getState().then((state) => {
      if (E.isRight(state)) {
        setAppState(state.right)
      }
    })
  })

  return (
    <Card sx={{ margin: 1 }}>
      <InfoGrid data={appState ?? {}} />
    </Card>
  )
}
