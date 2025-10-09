import { OriginGames } from '@pokemon-resources/pkg'
import { useContext } from 'react'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import PokemonIcon from 'src/components/PokemonIcon'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { OHPKM } from 'src/types/pkm/OHPKM'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { numericSorter, stringSorter } from 'src/util/Sort'
import './style.css'

export type OpenHomeMonListProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function OpenHomeMonList({ onSelectMon }: OpenHomeMonListProps) {
  const [{ homeMons }] = useContext(PersistedPkmDataContext)

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
      rows={Object.values(homeMons ?? {})}
      columns={columns}
      style={{ borderLeft: 'none', borderBottom: 'none' }}
    />
  )
}
