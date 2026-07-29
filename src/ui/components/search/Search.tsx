import { OHPKM } from '@openhome-core/pkm/OHPKM'

import useOhpkmColumns from '@openhome-ui/columns/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { PokemonSearchController } from './controllers'
import SearchFieldsForm from './SearchFields'
import SortableSearch from './SortableSearch'

interface PokemonSearchProps {
  controller: PokemonSearchController
}

function PokemonSearch({ controller }: PokemonSearchProps) {
  const { trackedMonsToRelease } = useSaves()
  const columns = useOhpkmColumns(trackedMonsToRelease, (mon) =>
    console.log(`selected ${mon.openhomeId}`)
  )

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
