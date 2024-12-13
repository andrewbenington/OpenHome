import { useContext } from 'react'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { getPublicImageURL } from 'src/images/images'
import { getMonSaveLogo } from 'src/saves/util'
import { AppInfoContext } from 'src/state/appInfo'
import { LookupContext } from 'src/state/lookup'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { numericSorter, stringSorter } from 'src/util/Sort'

export default function OpenHomeMonList() {
  const [{ homeMons }] = useContext(LookupContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

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
      name: '',
      width: 60,
      renderValue: (value) => (
        <PokemonIcon
          dexNumber={value.dexNum}
          formeNumber={value.formeNum}
          style={{ width: 30, height: 30 }}
        />
      ),
      cellClass: 'centered-cell',
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
        <img
          alt="save logo"
          height={40}
          src={getPublicImageURL(getMonSaveLogo(value, getEnabledSaveTypes()))}
        />
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
      sortFunction: stringSorter((val) => getMonFileIdentifier(val)),
      renderValue: (value) => getMonFileIdentifier(value),
      cellClass: 'mono-cell',
    },
  ]

  return <OHDataGrid rows={Object.values(homeMons ?? {})} columns={columns} />
}
