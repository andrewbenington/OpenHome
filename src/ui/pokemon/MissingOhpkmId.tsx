import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import PromptDialog, { PromptDialogAction } from '@openhome-ui/components/dialog/PromptDialog'
import { useBanksAndBoxes } from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { HomeMonLocation } from '@openhome-ui/state/saves'
import { Language, Lookup } from '@pkm-rs/pkg'
import { Button, Tooltip } from '@radix-ui/themes'
import { useState } from 'react'
import './MissingOhpkmId.css'

export type MissingOhpkmIdPromptProps = {
  openhomeId: OhpkmIdentifier
  location?: HomeMonLocation
  actions?: PromptDialogAction[]
}

export default function MissingOhpkmIdPrompt(props: MissingOhpkmIdPromptProps) {
  const { location, openhomeId } = props
  const [open, setOpen] = useState(false)
  const { clearAtHomeLocation } = useBanksAndBoxes()

  function dismissMissingIdDialog() {
    setOpen(false)
  }

  function clearMissingIdSlot() {
    if (location) clearAtHomeLocation(location)
    dismissMissingIdDialog()
  }

  const missingIdEvoFamily = Lookup.speciesName(
    parseInt(openhomeId.split('-')[0]),
    Language.English
  )

  let actions: PromptDialogAction[] = [
    { uniqueLabel: 'Cancel', action: dismissMissingIdDialog, type: 'cancel' },
  ]

  if (location) {
    actions.push({
      uniqueLabel: 'Clear this slot',
      action: clearMissingIdSlot,
      type: 'destructive',
    })
  }

  return (
    <>
      <Tooltip content={openhomeId}>
        <Button className="missing-id-button" radius="full" size="1" onClick={() => setOpen(true)}>
          !
        </Button>
      </Tooltip>
      <PromptDialog
        title="Tracking Data Missing"
        open={open}
        onClose={dismissMissingIdDialog}
        description={`This Pokémon's tracking data cannot be found. Its ID was ${openhomeId}, and is was from the ${missingIdEvoFamily} evolution family.`}
        actions={actions}
      />
    </>
  )
}
