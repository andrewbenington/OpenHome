import { OriginGames } from '@pokemon-resources/pkg'
import { Spinner } from '@radix-ui/themes'
import { useContext } from 'react'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { useLookups } from 'src/state/lookups'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { numericSorter, stringSorter } from 'src/util/Sort'
import { PersistedPkmDataContext } from '../../state/persistedPkmData'

type G12LookupRow = {
  gen12ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen12LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen12Lookup({ onSelectMon }: Gen12LookupProps) {
  const [{ homeMons }] = useContext(PersistedPkmDataContext)
  const { lookups, loaded } = useLookups()

  if (!loaded) {
    return <Spinner />
  }

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
            src={
              value.homeMon.pluginOrigin
                ? `logos/${value.homeMon.pluginOrigin}.png`
                : OriginGames.logoPath(value.homeMon.gameOfOrigin)
            }
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
      rows={Object.entries(lookups.gen12).map(([gen12ID, homeID]) => ({
        gen12ID,
        homeID,
        homeMon: pokemonFromLookupID(homeID),
      }))}
      columns={columns}
    />
  )
}
