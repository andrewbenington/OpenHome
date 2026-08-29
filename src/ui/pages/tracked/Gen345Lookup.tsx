import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import { isOk } from '@openhome-core/util/functional'
import {
  filterUndefined,
  gameOrPluginSorter,
  multiSorter,
  numericSorter,
  SortableColumn,
  stringSorter,
} from '@openhome-core/util/sort'
import Badge from '@openhome-ui/components/badge/Badge'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useLookups } from '@openhome-ui/state/lookups/useLookups'
import useOhpkmIdBatchLookup from '@openhome-ui/state/ohpkm/useOhpkmIdBatchLookup'
import { Language, Lookup, OriginGames } from '@pkm-rs/pkg'
import { Spinner } from '@radix-ui/themes'
type G345LookupRow = {
  gen345ID: string
  homeID: string
  homeMon?: OHPKM
}

type Gen345LookupProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function Gen345Lookup({ onSelectMon }: Gen345LookupProps) {
  const { lookups } = useLookups()
  const { loading, batchResults } = useOhpkmIdBatchLookup(Object.values(lookups.gen12))

  const columns: SortableColumn<G345LookupRow>[] = [
    {
      key: 'Pokémon',
      name: 'Mon',
      width: '5rem',
      renderValue: (value) =>
        value.homeMon && (
          <button
            onClick={() => value.homeMon && onSelectMon(value.homeMon)}
            className="mon-icon-button"
          >
            <PokemonIcon
              nationalDex={value.homeMon.nationalDex}
              formIndex={value.homeMon.formIndex}
              style={{ width: 30, height: 30 }}
            />
          </button>
        ),
      cellClass: 'centered-cell',
      sortFunction: multiSorter(
        numericSorter((value) => value.homeMon?.nationalDex),
        numericSorter((value) => value.homeMon?.formIndex)
      ),
      getFilterValue: (value) =>
        value.homeMon ? Lookup.speciesName(value.homeMon.nationalDex, Language.English) : undefined,
    },
    {
      key: 'game',
      name: 'Original Game',
      width: '10rem',
      renderValue: (value) => (
        <Badge.Game
          originGame={value.homeMon?.gameOfOrigin}
          plugin={value.homeMon?.pluginOrigin as PluginIdentifier}
          withName
        />
      ),
      getFilterValue: (val) =>
        val.homeMon ? OriginGames.gameNameFull(val.homeMon.gameOfOrigin) : '(Unknown)',
      sortFunction: gameOrPluginSorter(
        (val) => val.homeMon?.gameOfOrigin,
        (val) => val.homeMon?.pluginOrigin
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'gen345ID',
      name: 'Gen 3/4/5',
      width: '12rem',
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

  const rowsWithLoadedOhpkms: G345LookupRow[] = Object.entries(lookups.gen12)
    .map(([gen345ID, homeID]) => ({
      gen345ID,
      homeID,
      ohpkmResult: batchResults?.get(homeID),
    }))
    .map(({ gen345ID, homeID, ohpkmResult }) =>
      ohpkmResult !== undefined && isOk(ohpkmResult)
        ? { gen345ID, homeID, homeMon: ohpkmResult.data }
        : undefined
    )
    .filter(filterUndefined)

  return loading ? (
    <Spinner />
  ) : (
    <SortableDataGrid
      rows={rowsWithLoadedOhpkms}
      columns={columns}
      enableVirtualization={rowsWithLoadedOhpkms.length > 2000} // maybe this should be user-togglable
      defaultSort="Pokémon"
    />
  )
}
