import { OHPKM } from '@openhome/core/pkm/OHPKM'
import { useLookups } from '@openhome/ui/state/lookups'
import { useOhpkmStore } from '@openhome/ui/state/ohpkm/useOhpkmStore'
import { OriginGames } from '@pkm-rs/pkg'
import { Spinner } from '@radix-ui/themes'
import OHDataGrid, { SortableColumn } from 'src/ui/components/OHDataGrid'
import PokemonIcon from 'src/ui/components/PokemonIcon'
import { numericSorter, stringSorter } from 'src/util/Sort'

type G345LookupRow = {
  gen345ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen345LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen345Lookup({ onSelectMon }: Gen345LookupProps) {
  const ohpkmStore = useOhpkmStore()
  const { lookups, loaded } = useLookups()

  if (!loaded) {
    return <Spinner />
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
        homeMon: ohpkmStore.getById(homeID),
      }))}
      columns={columns}
    />
  )
}
