import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { PluginIdentifier } from '@openhome-core/save/interfaces'
import {
  gameOrPluginSorter,
  gameSorter,
  multiSorter,
  numericSorter,
  SortableColumn,
  stringSorter,
} from '@openhome-core/util/sort'
import { OriginGameIndicator } from '@openhome-ui/components/pokemon/indicator/OriginGame'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { useSaves } from '@openhome-ui/state/saves'
import { MetadataLookup } from '@pkm-rs/pkg'
import './style.css'

export type AllTrackedPokemonProps = {
  onSelectMon: (mon: OHPKM) => void
}

export default function AllTrackedPokemon({ onSelectMon }: AllTrackedPokemonProps) {
  const ohpkmStore = useOhpkmStore()
  const saves = useSaves()

  const columns: SortableColumn<OHPKM>[] = [
    {
      key: 'Pokémon',
      name: 'Mon',
      width: '5rem',
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
      sortFunction: multiSorter(
        numericSorter((mon) => mon.dexNum),
        numericSorter((mon) => mon.formeNum)
      ),
      getFilterValue: (value) =>
        MetadataLookup(value.dexNum, value.formeNum)?.speciesName || 'Unknown',
    },
    {
      key: 'nickname',
      name: 'Nickname',
      width: '8rem',
      sortFunction: stringSorter((mon) => mon.nickname),
      noFilter: true,
    },
    {
      key: 'home_bank',
      name: 'Bank',
      width: '6rem',
      renderValue: (value) => {
        const bankIndex = saves.homeData.findIfPresent(value.getHomeIdentifier())?.bank
        return typeof bankIndex === 'number' ? `Bank ${bankIndex + 1}` : undefined
      },
      getFilterValue: (value) => {
        const bankIndex = saves.homeData.findIfPresent(value.getHomeIdentifier())?.bank
        return bankIndex !== undefined ? `Bank ${bankIndex + 1}` : 'Not in OpenHome Boxes'
      },
      sortFunction: numericSorter(
        (mon) => saves.homeData.findIfPresent(mon.getHomeIdentifier())?.bank
      ),
    },
    {
      key: 'home_box',
      name: 'Box + Slot',
      width: '8rem',
      renderValue: (mon) => {
        const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
        return location ? (
          <span>
            <b>Box {location.box + 1}</b> [{location.boxSlot + 1}]
          </span>
        ) : undefined
      },
      getFilterValue: (mon) => {
        const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
        return location ? `Box ${location.box + 1}` : 'Not in OpenHome Boxes'
      },
      sortFunction: numericSorter((mon) => {
        const location = saves.homeData.findIfPresent(mon.getHomeIdentifier())
        return location ? location.box + location.boxSlot / 120 : -1
      }),
    },
    {
      key: 'last_save',
      name: 'Last Save',
      width: '9rem',
      renderValue: (value) => (
        <div className="flex-row-centered">
          <OriginGameIndicator
            originGame={value.mostRecentSaveWasm?.game}
            withName
            tooltip={value.mostRecentSaveWasm?.file_path}
          />
        </div>
      ),
      cellClass: 'centered-cell',
      sortFunction: gameSorter((mon) => mon.mostRecentSaveWasm?.game),
    },
    {
      key: 'level',
      name: 'Level',
      width: '4rem',
      renderValue: (value) => value.getLevel(),
    },
    {
      key: 'game',
      name: 'Original Game',
      width: '10rem',
      renderValue: (value) => (
        <div className="flex-row-centered">
          <OriginGameIndicator
            originGame={value.gameOfOrigin}
            plugin={value.pluginOrigin as PluginIdentifier}
            withName
          />
        </div>
      ),
      sortFunction: gameOrPluginSorter(
        (mon) => mon.gameOfOrigin,
        (mon) => mon.pluginOrigin
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerName',
      name: 'OT',
      width: '6rem',
    },
    {
      key: 'homeID',
      name: 'OpenHome ID',
      minWidth: 240,
      sortFunction: stringSorter((mon) => mon.getHomeIdentifier()),
      renderValue: (mon) => mon.getHomeIdentifier(),
      cellClass: 'mono-cell',
    },
  ]

  const keyGetter = (row: NoInfer<OHPKM>): string => {
    return row.getHomeIdentifier()
  }

  return (
    <SortableDataGrid
      rows={ohpkmStore.getAllStored()}
      columns={columns}
      style={{ borderLeft: 'none', borderBottom: 'none', width: '100%', flex: 1 }}
      rowKeyGetter={keyGetter}
    />
  )
}
