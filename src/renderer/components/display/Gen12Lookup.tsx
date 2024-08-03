import { PokemonData } from 'pokemon-species-data'
import { useLookupMaps } from 'src/renderer/redux/selectors'
import { stringSorter } from 'src/util/Sort'
import OHDataGrid, { SortableColumn } from '../OHDataGrid'
import PokemonIcon from '../PokemonIcon'

function pokemonFromLookupID(id: string) {
  return PokemonData[parseInt(id.split('-')[0])]
}

export default function Gen12Lookup() {
  const [, lookupMap] = useLookupMaps()
  const columns: SortableColumn<[string, string]>[] = [
    // {
    //   key: 'display',
    //   name: 'Display',
    //   width: 80,

    //   renderCell: (params) => <DevDataDisplay data={params.row} />,
    //   cellClass: 'centered-cell',
    // },
    {
      key: 'Base Pokémon',
      name: 'Base Pokémon',
      width: 100,
      renderValue: (value) => {
        const baseMon = pokemonFromLookupID(value[1])
        return <PokemonIcon dexNumber={baseMon.nationalDex} style={{ width: 30, height: 30 }} />
      },
      sortFunction: stringSorter((val) => val[1]),
      cellClass: 'centered-cell',
    },
    {
      key: 'Gen 1/2',
      name: 'Gen 1/2',
      minWidth: 180,
      renderValue: (value) => value[0],
      sortFunction: stringSorter((val) => val[0]),
    },
    {
      key: 'OpenHome',
      name: 'OpenHome',
      minWidth: 180,
      renderValue: (value) => value[1],
      sortFunction: stringSorter((val) => val[1]),
    },
  ]
  return <OHDataGrid rows={Object.entries(lookupMap ?? {})} columns={columns} />
}
