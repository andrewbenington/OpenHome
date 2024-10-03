import { useContext } from 'react'
import { getSaveLogo } from 'src/renderer/saves/util'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import OHDataGrid, { SortableColumn } from '../../components/OHDataGrid'
import PokemonIcon from '../../components/PokemonIcon'
import { LookupContext } from '../../state/lookup'

type G345LookupRow = {
  gen345ID: string
  homeID: string
  homeMon?: OHPKM
}

export default function Gen345Lookup() {
  const [{ homeMons, gen345 }] = useContext(LookupContext)

  function pokemonFromLookupID(id: string) {
    if (!homeMons) return undefined
    return homeMons[id]
    // return PokemonData[parseInt(id.split('-')[0])]
  }

  const columns: SortableColumn<G345LookupRow>[] = [
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
      key: 'gen345ID',
      name: 'Gen 3/4/5',
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
      rows={Object.entries(gen345 ?? {}).map(([gen345ID, homeID]) => ({
        gen345ID,
        homeID,
        homeMon: pokemonFromLookupID(homeID),
      }))}
      columns={columns}
    />
  )
}
