import { PKMInterface } from 'src/core/pkm/interfaces.ts'
import { OhpkmStore } from 'src/ui/state/ohpkm'
import { ErrorMessageData } from 'src/ui/state/error.ts'
import { HomeMonLocation, MonLocation, SaveMonLocation } from 'src/ui/state/saves'
import { getMonFileIdentifier } from 'src/core/pkm/Lookup.ts'
import { OHPKM } from 'src/core/pkm/OHPKM.ts'

export function importMonsIfNotPresent(
  mons: PKMInterface[],
  ohpkmStore: OhpkmStore,
  dispatchError: (
    value:
      | {
          type: 'set_message'
          payload: ErrorMessageData
        }
      | {
          type: 'clear_message'
          payload?: undefined
        }
  ) => void,
  importMonsToLocation: (mons: PKMInterface[], startingAt: MonLocation) => void,
  location: SaveMonLocation | HomeMonLocation,
  allowDupeImport: boolean
) {
  for (const mon of mons) {
    try {
      const identifier = getMonFileIdentifier(new OHPKM(mon))

      if (!identifier) continue

      if (!allowDupeImport && ohpkmStore.monIsStored(identifier)) {
        const message =
          mons.length === 1
            ? 'This Pokémon has been moved into OpenHome before.'
            : 'One or more of these Pokémon has been moved into OpenHome before.'

        dispatchError({
          type: 'set_message',
          payload: { title: 'Import Failed', messages: [message] },
        })
        return
      }
    } catch (e) {
      dispatchError({
        type: 'set_message',
        payload: { title: 'Import Failed', messages: [`${e}`] },
      })
    }
  }
  importMonsToLocation(mons, location)
}
