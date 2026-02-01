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
import { MetadataLookup, OriginGames } from '@pkm-rs/pkg'
import { Option } from 'src/core/util/functional'
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
      width: '5rem',
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
      getFilterValue: (mon) => {
        const game = mon.mostRecentSaveWasm?.game
        return game ? OriginGames.gameName(game) : '(Unknown)'
      },
      cellClass: 'centered-cell',
      sortFunction: gameSorter((mon) => mon.mostRecentSaveWasm?.game),
    },
    {
      key: 'level',
      name: 'Level',
      width: '6rem',
      renderValue: (value) => value.getLevel(),
      getFilterValue: (mon) => getLevelRange(mon.getLevel()),
      getFilterValueDropdownPos: (filterValue) =>
        filterValue ? levelRangeOrderPos(filterValue as LevelRangeBy10) : 0,
      sortFunction: numericSorter((mon) => mon.getLevel()),
    },
    {
      key: 'game',
      name: 'Original Game',
      width: '10rem',
      renderValue: (value) => (
        <OriginGameIndicator
          originGame={value.gameOfOrigin}
          plugin={value.pluginOrigin as PluginIdentifier}
          withName
        />
      ),
      getFilterValue: (mon) => OriginGames.gameName(mon.gameOfOrigin),
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

type LevelRangeBy10 =
  | '1-10'
  | '11-20'
  | '21-30'
  | '31-40'
  | '41-50'
  | '51-60'
  | '61-70'
  | '71-80'
  | '81-90'
  | '91-99'
  | '100'

function getLevelRange(level: number): Option<LevelRangeBy10> {
  if (level === 100) return '100'
  switch (Math.floor((level - 1) / 10)) {
    case 0:
      return '1-10'
    case 1:
      return '11-20'
    case 2:
      return '21-30'
    case 3:
      return '31-40'
    case 4:
      return '41-50'
    case 5:
      return '51-60'
    case 6:
      return '61-70'
    case 7:
      return '71-80'
    case 8:
      return '81-90'
    case 9:
      return '91-99'
    default:
      return undefined
  }
}

function levelRangeOrderPos(levelRange: LevelRangeBy10): number {
  if (levelRange === '100') return Number.POSITIVE_INFINITY

  return parseInt(levelRange.split('-')[0])
}
