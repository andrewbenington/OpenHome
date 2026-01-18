import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { OriginGames } from '@pkm-rs/pkg'
import SortableDataGrid from 'src/ui/components/OHDataGrid'
import { useLookups } from 'src/ui/state/lookups/useLookups'

type G12LookupRow = {
  gen12ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen12LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen12Lookup({ onSelectMon }: Gen12LookupProps) {
  const ohpkmStore = useOhpkmStore()
  const { lookups } = useLookups()

  const columns: SortableColumn<G12LookupRow>[] = [
    {
      key: 'Pokémon',
      name: '',
      width: '5rem',
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
      width: '8rem',
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
    <SortableDataGrid
      rows={Object.entries(lookups.gen12).map(([gen12ID, homeID]) => ({
        gen12ID,
        homeID,
        homeMon: ohpkmStore.getById(homeID),
      }))}
      columns={columns}
    />
  )
}
