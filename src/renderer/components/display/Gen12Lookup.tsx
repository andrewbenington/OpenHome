import { useLookupMaps } from 'src/renderer/redux/selectors'
import { getSaveLogo } from 'src/renderer/saves/util'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import OHDataGrid, { SortableColumn } from '../OHDataGrid'
import PokemonIcon from '../PokemonIcon'

type G12LookupRow = {
  gen12ID: string
  homeID: string
  homeMon?: OHPKM
}

export default function Gen12Lookup() {
  const [homeMons, gen12LookupMap] = useLookupMaps()

  function pokemonFromLookupID(id: string) {
    if (!homeMons) return undefined
    return homeMons[id]
    // return PokemonData[parseInt(id.split('-')[0])]
  }

  const columns: SortableColumn<G12LookupRow>[] = [
    // {
    //   key: 'display',
    //   name: 'Display',
    //   width: 80,

    //   renderCell: (params) => <DevDataDisplay data={params.row} />,
    //   cellClass: 'centered-cell',
    // },
    {
      key: 'Pokémon',
      name: 'Pokémon',
      width: 100,
      renderValue: (value) =>
        value.homeMon && (
          <PokemonIcon
            dexNumber={value.homeMon.dexNum}
            formeNumber={value.homeMon.formeNum}
            style={{ width: 30, height: 30 }}
          />
        ),
      cellClass: 'centered-cell',
    },
    {
      key: 'game',
      name: 'Original Game',
      width: 130,
      renderValue: (value) =>
        value.homeMon && (
          <img alt="save logo" height={40} src={getSaveLogo(value.homeMon.gameOfOrigin)} />
        ),
      sortFunction: numericSorter((val) => val.homeMon?.gameOfOrigin),
      cellClass: 'centered-cell',
    },
    {
      key: 'gen12ID',
      name: 'Gen 1/2',
      minWidth: 180,
      sortFunction: stringSorter((val) => val[0]),
      cellClass: 'mono-cell',
    },
    {
      key: 'homeID',
      name: 'OpenHome',
      minWidth: 180,
      sortFunction: stringSorter((val) => val[1]),
      cellClass: 'mono-cell',
    },
  ]
  return (
    <OHDataGrid
      rows={Object.entries(gen12LookupMap ?? {}).map(([gen12ID, homeID]) => ({
        gen12ID,
        homeID,
        homeMon: pokemonFromLookupID(homeID),
      }))}
      columns={columns}
    />
  )
}
