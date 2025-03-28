import { useContext } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { getPublicImageURL } from 'src/images/images'
import { getMonSaveLogo } from 'src/saves/util'
import { AppInfoContext } from 'src/state/appInfo'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import { LookupContext } from '../../state/lookup'

type G12LookupRow = {
  gen12ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen12LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen12Lookup({ onSelectMon }: Gen12LookupProps) {
  const [{ homeMons, gen12 }] = useContext(LookupContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)

  backend.getResourcesPath().then(console.info)

  function pokemonFromLookupID(id: string) {
    if (!homeMons) return undefined
    return homeMons[id]
  }

  const columns: SortableColumn<G12LookupRow>[] = [
    {
      key: 'Pokémon',
      name: '',
      width: 60,
      renderValue: (value) =>
        value.homeMon && (
          <button
            onClick={() => value.homeMon && onSelectMon(value.homeMon)}
            className="mon-icon-button"
          >
            <PokemonIcon
              dexNumber={value.homeMon.dexNum}
              formeNumber={value.homeMon.formeNum}
              style={{ width: 30, height: 30 }}
            />
          </button>
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
      sortFunction: stringSorter((val) => val.gen12ID),
      cellClass: 'mono-cell',
    },
    {
      key: 'homeID',
      name: 'OpenHome',
      minWidth: 180,
      sortFunction: stringSorter((val) => val.homeID),
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
