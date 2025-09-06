import { Spinner } from '@radix-ui/themes'
import { useContext } from 'react'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { getPublicImageURL } from 'src/images/images'
import { getMonSaveLogo } from 'src/saves/util'
import { AppInfoContext } from 'src/state/appInfo'
import { useLookups } from 'src/state/lookups'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import { PersistedPkmDataContext } from '../../state/persistedPkmData'

type G345LookupRow = {
  gen345ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen345LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen345Lookup({ onSelectMon }: Gen345LookupProps) {
  const [{ homeMons }] = useContext(PersistedPkmDataContext)
  const { lookups, loaded } = useLookups()
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

  if (!loaded) {
    return <Spinner />
  }

  function pokemonFromLookupID(id: string) {
    if (!homeMons) return undefined
    return homeMons[id]
    // return PokemonData[parseInt(id.split('-')[0])]
  }

  const columns: SortableColumn<G345LookupRow>[] = [
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
      key: 'gen345ID',
      name: 'Gen 3/4/5',
      minWidth: 180,
      sortFunction: stringSorter((val) => val.gen345ID),
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
      rows={Object.entries(lookups.gen345).map(([gen345ID, homeID]) => ({
        gen345ID,
        homeID,
        homeMon: pokemonFromLookupID(homeID),
      }))}
      columns={columns}
    />
  )
}
