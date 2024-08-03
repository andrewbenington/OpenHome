import { DataObject } from '@mui/icons-material'
import { Button, Dialog } from '@mui/material'
import { useState } from 'react'
import { InfoGrid } from './InfoGrid'

type DevDataDisplayProps = {
  data?: object
  icon?: JSX.Element
}

export function DevDataDisplay(props: DevDataDisplayProps) {
  const [debugModal, setDebugModal] = useState(false)
  return (
    <>
      <Button
        variant="outlined"
        style={{
          padding: '0px 8px',
          minWidth: 0,
          minHeight: 0,
          height: 'fit-content',
          marginTop: 'auto',
          marginBottom: 'auto',
        }}
        onClick={() => setDebugModal(true)}
      >
        {props.icon ?? <DataObject />}
      </Button>
      <Dialog open={debugModal} onClose={() => setDebugModal(false)}>
        <InfoGrid labelBreakpoints={{ xs: 4 }} data={props.data ?? {}} />
      </Dialog>
    </>
  )
}
