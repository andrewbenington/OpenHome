import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { multiSorter, numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import SortableDataGrid from 'src/ui/components/SortableDataGrid'
import { useLookups } from 'src/ui/state/lookups/useLookups'
import { PluginIdentifier } from '../../../core/save/interfaces'
import { OriginGameIndicator } from '../../components/pokemon/indicator/OriginGame'

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
      name: 'Mon',
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
      width: '10rem',
      renderValue: (value) => (
        <div
          style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}
        >
          <OriginGameIndicator
            originGame={value.homeMon?.gameOfOrigin}
            plugin={value.homeMon?.pluginOrigin as PluginIdentifier}
            withName
          />
        </div>
      ),
      sortFunction: multiSorter(
        numericSorter((val) => val.homeMon?.gameOfOrigin),
        stringSorter((val) => val.homeMon?.pluginOrigin ?? '.') // so official games come before plugins
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'gen12ID',
      name: 'Gen 1/2',
      width: '14rem',
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
      enableVirtualization={Object.entries(lookups.gen12).length > 2000} // maybe this should be user-togglable
    />
  )
}
