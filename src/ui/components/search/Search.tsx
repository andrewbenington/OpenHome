import { OHPKM } from '@openhome-core/pkm/OHPKM'

import useOhpkmColumns from '@openhome-ui/columns/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
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
    />
  )
}

const Search = {
  Pokemon: PokemonSearch,
}

export default Search
