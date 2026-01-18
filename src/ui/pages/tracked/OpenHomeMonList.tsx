import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { numericSorter, stringSorter } from '@openhome-core/util/sort'
import OHDataGrid, { SortableColumn } from '@openhome-ui/components/OHDataGrid'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { OriginGames } from '@pkm-rs/pkg'
import { Flex } from '@radix-ui/themes'
import { Indicator } from 'src/ui/saves/Indicator'
import { useSaves } from 'src/ui/state/saves'
import './style.css'

export type OpenHomeMonListProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function OpenHomeMonList({ onSelectMon }: OpenHomeMonListProps) {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()

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
      key: 'home_box',
      name: 'OpenHome Location',
      width: 150,
      renderValue: (value) => {
        for (const bank of saves.homeData.banks) {
          for (const box of bank.boxes) {
            if (
              box.identifiers
                .keys()
                .some((slot) => box.identifiers.get(slot) === value.getHomeIdentifier())
            ) {
              const bankName = bank.name ?? `Bank ${bank.index + 1}`
              const boxName = box.name ?? `Box ${box.index + 1}`
              return `${bankName} -> ${boxName}`
            }
          }
        }
      },
    },
    {
      key: 'last_save',
      name: 'Last Save',
      width: 150,
      renderValue: (value) => (
        <Flex direction="column">
          <Indicator.OriginGame originGame={value.mostRecentSaveWasm?.game} />
          <div title={value.mostRecentSaveWasm?.file_path}>
            {value.mostRecentSaveWasm?.file_path}

            {value.mostRecentSaveWasm?.file_path}
          </div>
        </Flex>
      ),
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
