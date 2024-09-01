import { Stack } from '@mui/joy'
import { PokemonData } from 'pokemon-species-data'
import { useLookupMaps } from 'src/renderer/redux/selectors'
import { getSaveLogo } from 'src/renderer/saves/util'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import { getMonFileIdentifier } from '../../../util/Lookup'
import OHDataGrid, { SortableColumn } from '../OHDataGrid'
import PokemonIcon from '../PokemonIcon'

export default function OpenHomeMonList() {
  const [homeMons] = useLookupMaps()

  const columns: SortableColumn<OHPKM>[] = [
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
      width: 120,
      renderValue: (value) => (
        <Stack direction="row">
          <PokemonIcon
            dexNumber={value.dexNum}
            formeNumber={value.formeNum}
            style={{ width: 30, height: 30 }}
          />
          <div>{PokemonData[value.dexNum].name}</div>
        </Stack>
      ),
    },
    {
      key: 'nickname',
      name: 'Nickname',
      width: 100,
    },
    {
      key: 'level',
      name: 'Level',
      width: 100,
    },
    {
      key: 'game',
      name: 'Original Game',
      width: 130,
      renderValue: (value) => (
        <img alt="save logo" height={40} src={getSaveLogo(value.gameOfOrigin)} />
      ),
      sortFunction: numericSorter((val) => val?.gameOfOrigin),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerName',
      name: 'OT',
      width: 100,
    },
    {
      key: 'homeID',
      name: 'OpenHome ID',
      minWidth: 180,
      sortFunction: stringSorter((val) => val[1]),
      renderValue: (value) => getMonFileIdentifier(value),
      cellClass: 'mono-cell',
    },
  ]
  return <OHDataGrid rows={Object.values(homeMons ?? {})} columns={columns} />
}
