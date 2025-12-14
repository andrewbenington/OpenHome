import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { numericSorter, stringSorter } from '@openhome-core/util/sort'
import OHDataGrid, { SortableColumn } from '@openhome-ui/components/OHDataGrid'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm/useOhpkmStore'
import { OriginGames } from '@pkm-rs/pkg'
import './style.css'

export type OpenHomeMonListProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function OpenHomeMonList({ onSelectMon }: OpenHomeMonListProps) {
  const ohpkmStore = useOhpkmStore()

  const columns: SortableColumn<OHPKM>[] = [
    {
      key: 'Pokémon',
      name: '',
      width: 60,
      renderValue: (value) => (
        <button onClick={() => onSelectMon(value)} className="mon-icon-button">
          <PokemonIcon
            dexNumber={value.dexNum}
            formeNumber={value.formeNum}
            style={{ width: 30, height: 30 }}
          />
        </button>
      ),
      cellClass: 'centered-cell',
      sortFunction: numericSorter((mon) => mon.dexNum),
    },
    {
      key: 'nickname',
      name: 'Nickname',
      width: 100,
      sortFunction: stringSorter((mon) => mon.nickname),
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
          src={
            value.pluginOrigin
              ? `logos/${value.pluginOrigin}.png`
              : OriginGames.logoPath(value.gameOfOrigin)
          }
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

  return (
    <OHDataGrid
      rows={ohpkmStore.getAllStored()}
      columns={columns}
      style={{ borderLeft: 'none', borderBottom: 'none' }}
    />
  )
}
