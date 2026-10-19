import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { PromptDialogAction } from '@openhome-ui/components/dialog/PromptDialog'
import { useBanksAndBoxes } from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { HomeMonLocation } from '@openhome-ui/state/saves'
import { Language, Lookup } from '@pkm-rs/pkg'
import SlotPokemonError from './SlotPokemonError'

export type MissingOhpkmIdPromptProps = {
  openhomeId: OhpkmIdentifier
  location?: HomeMonLocation
  actions?: PromptDialogAction[]
}

export default function MissingOhpkmIdPrompt(props: MissingOhpkmIdPromptProps) {
  const { location, openhomeId } = props
  const { clearAtHomeLocation } = useBanksAndBoxes()

  function clearMissingIdSlot() {
    if (location) clearAtHomeLocation(location)
  }

  const missingIdEvoFamily = Lookup.speciesName(
    parseInt(openhomeId.split('-')[0]),
    Language.English
  )

  let actions: PromptDialogAction[] = location
    ? [
        {
          uniqueLabel: 'Clear this slot',
          action: clearMissingIdSlot,
          type: 'destructive',
        },
      ]
    : []

  return (
    <SlotPokemonError
      errorTitle="Tracking Data Missing"
      errorDescription={`This Pokémon's tracking data cannot be found. Its ID was ${openhomeId}, and it was from the ${missingIdEvoFamily} evolution family.`}
      actions={actions}
      tooltip={openhomeId}
    />
  )
}
