import { useContext } from 'react'
import { getPublicImageURL } from 'src/images/images'
import { getMonSaveLogo } from 'src/saves/util'
import { AppInfoContext } from 'src/state/appInfo'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { LookupContext } from '../../state/lookup'
import { BackendContext } from 'src/backend/backendProvider'

type G12LookupRow = {
  gen12ID: string
  homeID: string
  homeMon?: OHPKM
}

export default function Gen12Lookup() {
  const [{ homeMons, gen12 }] = useContext(LookupContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  backend.getResourcesPath().then(console.info)

  function pokemonFromLookupID(id: string) {
    if (!homeMons) return undefined
    return homeMons[id]
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
          <img
            alt="save logo"
            height={40}
            src={getPublicImageURL(getMonSaveLogo(value.homeMon, getEnabledSaveTypes()))}
          />
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
      rows={Object.entries(gen12 ?? {}).map(([gen12ID, homeID]) => ({
        gen12ID,
        homeID,
        homeMon: pokemonFromLookupID(homeID),
      }))}
      columns={columns}
    />
  )
}
