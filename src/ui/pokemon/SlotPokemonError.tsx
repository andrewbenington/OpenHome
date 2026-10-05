import PromptDialog, { PromptDialogAction } from '@openhome-ui/components/dialog/PromptDialog'
import { Button, Tooltip } from '@radix-ui/themes'
import { useState } from 'react'
import './SlotPokemonError.css'

export type SlotPokemonErrorProps = {
  errorTitle: string
  errorDescription: string
  tooltip?: string
  actions?: PromptDialogAction[]
}

export default function SlotPokemonError(props: SlotPokemonErrorProps) {
  const { errorTitle, errorDescription, tooltip } = props
  const [open, setOpen] = useState(false)

  function dismissDialog() {
    setOpen(false)
  }

  let actions: PromptDialogAction[] = [
    { uniqueLabel: 'Cancel', action: dismissDialog, type: 'cancel' },
  ]

  const button = (
    <Button className="missing-id-button" radius="full" size="1" onClick={() => setOpen(true)}>
      !
    </Button>
  )

  return (
    <>
      {tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button}
      <PromptDialog
        title={errorTitle}
        open={open}
        onClose={dismissDialog}
        description={errorDescription}
        actions={[...actions, ...(props.actions ?? [])]}
      />
    </>
  )
}
