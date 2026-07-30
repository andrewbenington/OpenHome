import { OHPKM } from '@openhome-core/pkm/OHPKM'

import useOhpkmColumns from '@openhome-ui/columns/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { Callout } from '@radix-ui/themes'
import { ErrorIcon } from '../Icons'
import SearchFieldsForm from './SearchFields'
import SortableSearch from './SortableSearch'
import { PokemonSearchController } from './usePokemonSearch'

interface PokemonSearchProps {
  controller: PokemonSearchController
}

function PokemonSearch({ controller }: PokemonSearchProps) {
  const { trackedMonsToRelease } = useSaves()
  const columns = useOhpkmColumns(trackedMonsToRelease)

  return (
    <SortableSearch<OHPKM, PokemonSearchController>
      FormComponent={SearchFieldsForm.Pokemon}
      controller={controller}
      columns={columns}
      topRightComponent={
        <Callout.Root color="yellow" size="1">
          <Callout.Icon>
            <ErrorIcon style={{ width: '1rem', height: '1rem' }} />
          </Callout.Icon>
          Only Pokémon with the same base evolution will appear here
        </Callout.Root>
      }
    />
  )
}

const Search = {
  Pokemon: PokemonSearch,
}

export default Search
