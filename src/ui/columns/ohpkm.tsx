import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { Option } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import {
  SortableColumn,
  booleanSorter,
  dayjsSorter,
  gameOrPluginSorter,
  gameSorter,
  multiSorter,
  numericSorter,
  stringSorter,
} from '@openhome-core/util/sort'
import Badge from '@openhome-ui/components/badge/Badge'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { getPublicImageURL } from '@openhome-ui/images/images'
import {
  BankBoxCoordinates,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { Language, Lookup, OriginGames } from '@pkm-rs/pkg'
import { useRef } from 'react'
import { SelectColumn } from 'react-data-grid'
import { OhpkmRowData } from './tanstackOhpkmRowData'

export default function useOhpkmColumns(
  trackedMonsToRelease: OhpkmIdentifier[],
  onSelectMon?: (id: OhpkmIdentifier) => void
): SortableColumn<OhpkmRowData>[] {
  const { getBankName, getBoxName, findHomeLocation } = useBanksAndBoxes()

  // this is necessary because the renderer functions do not update correctly when dependencies change
  const trackedMonsRef = useRef(trackedMonsToRelease)
  trackedMonsRef.current = trackedMonsToRelease

  return [
    { ...SelectColumn, minWidth: 36, width: undefined },
    {
      key: 'Pokémon',
      name: 'Mon',
      width: '3rem',
      frozen: true,
      renderValue: (value) => (
        <div className="flex-row-centered">
          <button onClick={() => onSelectMon?.(value.openhomeId)} className="mon-icon-button">
            <PokemonIcon
              nationalDex={value.nationalDex}
              formIndex={value.formIndex}
              style={{ height: '1.75rem', width: '1.75rem' }}
            />
          </button>
        </div>
      ),
      cellClass: 'centered-cell',
      sortFunction: multiSorter(
        numericSorter((mon) => mon.nationalDex),
        numericSorter((mon) => mon.formIndex)
      ),
      getFilterValue: (value) => Lookup.speciesName(value.nationalDex, Language.English),
    },
    {
      key: 'nickname',
      name: 'Nickname',
      width: '6.5rem',
      frozen: true,
      sortFunction: stringSorter((mon) => mon.nickname),
      noFilter: true,
      renderValue: (mon) => mon.nickname,
    },
    {
      key: 'type1',
      name: 'Type 1',
      width: '4rem',
      sortFunction: stringSorter((mon) => mon.type1),
      renderValue: (mon) => (
        <div className="flex-row-centered">
          <TypeIcon size="1.5rem" type={mon.type1} />
        </div>
      ),
      getFilterValue: (mon) => mon.type1,
      cellClass: 'centered-cell',
    },
    {
      key: 'type2',
      name: 'Type 2',
      width: '4rem',
      sortFunction: stringSorter((mon) => mon.type2),
      renderValue: (mon) =>
        $O(mon.type2)
          .map((type2) => (
            <div key={`type2-${type2}`} className="flex-row-centered">
              <TypeIcon size="1.5rem" type={type2} />
            </div>
          ))
          .get(),
      getFilterValue: (mon) => mon.type2 || 'Unknown',
      cellClass: 'centered-cell',
    },
    {
      key: 'home_bank',
      name: 'Bank',
      width: '10rem',
      renderValue: (mon) => {
        if (trackedMonsRef.current.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const bankIndex = findHomeLocation(mon.openhomeId)?.bank
        return typeof bankIndex === 'number' ? getBankName(bankIndex) : undefined
      },
      getFilterValue: (mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) return 'Release Area'
        const bankIndex = findHomeLocation(mon.openhomeId)?.bank
        return bankIndex !== undefined ? getBankName(bankIndex) : 'Not in OpenHome Boxes'
      },
      sortFunction: numericSorter((mon) =>
        trackedMonsToRelease.includes(mon.openhomeId)
          ? Number.POSITIVE_INFINITY
          : findHomeLocation(mon.openhomeId)?.bank
      ),
    },
    {
      key: 'home_box',
      name: 'Box + Slot',
      width: '16rem',
      renderValue: (mon) => {
        if (trackedMonsRef.current.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const location = findHomeLocation(mon.openhomeId)
        return location ? (
          <span>
            <b>{getBoxName(location.bank, location.box)}</b> [slot {location.boxSlot + 1}]
          </span>
        ) : undefined
      },
      getFilterValue: (mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) {
          return 'Release Area'
        }
        const location = findHomeLocation(mon.openhomeId)
        return location ? `Box ${location.box + 1}` : 'Not in OpenHome Boxes'
      },
      sortFunction: stringSorter((mon) => {
        if (trackedMonsToRelease.includes(mon.openhomeId)) {
          return '$RELEASE'
        }
        const location = findHomeLocation(mon.openhomeId)
        return locationToSortableString(location)
      }),
    },
    {
      key: 'last_save',
      name: 'Last Save',
      width: '10rem',
      renderValue: (value) => (
        <div className="flex-row-centered">
          <Badge.Game
            originGame={value.mostRecentSaveWasm?.game}
            withName
            tooltip={value.mostRecentSaveWasm?.file_path}
          />
        </div>
      ),
      getFilterValue: (mon) => {
        const game = mon.mostRecentSaveWasm?.game
        return game ? OriginGames.gameNameFull(game) : '(Unknown)'
      },
      cellClass: 'centered-cell',
      sortFunction: gameSorter((mon) => mon.mostRecentSaveWasm?.game),
    },
    {
      key: 'game',
      name: 'Original Game',
      width: '10rem',
      renderValue: (value) => (
        <div className="flex-row-centered">
          <Badge.Game originGame={value.gameOfOrigin} plugin={value.pluginOrigin} withName />
        </div>
      ),
      getFilterValue: (mon) => OriginGames.gameNameFull(mon.gameOfOrigin),
      sortFunction: gameOrPluginSorter(
        (mon) => mon.gameOfOrigin,
        (mon) => mon.pluginOrigin
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'started_tracking',
      name: 'First Tracked',
      width: '8rem',
      renderValue: (value) => value.startedTrackingTimestamp?.format('MMM DD, YYYY'),
      sortFunction: dayjsSorter((mon) => mon.startedTrackingTimestamp, true),
      noFilter: true,
    },
    {
      key: 'trainerName',
      name: 'OT',
      width: '6rem',
      renderValue: (mon) => mon.trainerName,
    },
    {
      key: 'nature',
      name: 'Nature',
      width: '6rem',
      renderValue: (mon) => mon.natureName,
      getFilterValue: (mon) => mon.natureName,
    },
    {
      key: 'is_shiny',
      name: 'Shiny',
      width: '3rem',
      renderValue: (mon) =>
        mon.isShiny ? (
          <img
            className="grid-shiny-icon invert-light"
            alt="shiny icon"
            draggable={false}
            src={getPublicImageURL('icons/Shiny.png')}
          />
        ) : null,
      getFilterValue: (mon) => (mon.isShiny ? 'Shiny' : 'Not Shiny'),
      sortFunction: booleanSorter((mon) => mon.isShiny),
      cellClass: 'centered-cell',
    },
    {
      key: 'gender',
      name: 'Gender',
      width: '4rem',
      renderValue: (mon) => <GenderIcon gender={mon.gender} />,
      getFilterValue: (mon) =>
        mon.gender === 0 ? 'Male' : mon.gender === 1 ? 'Female' : 'Genderless',
      cellClass: 'centered-cell',
    },
    {
      key: 'level',
      name: 'Level',
      width: '5rem',
      renderValue: (value) => value.level,
      getFilterValue: (mon) => getLevelRange(mon.level),
      getFilterValueDropdownPos: (filterValue) =>
        filterValue ? levelRangeOrderPos(filterValue as LevelRangeBy10) : 0,
      sortFunction: numericSorter((mon) => mon.level),
      cellClass: 'number-cell',
    },
    {
      key: 'hp',
      name: 'HP',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.hp.toString(),
      getFilterValue: (mon) => mon.stats.hp.toString(),
      sortFunction: numericSorter((mon) => mon.stats.hp),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'atk',
      name: 'ATK',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.atk.toString(),
      getFilterValue: (mon) => mon.stats.atk.toString(),
      sortFunction: numericSorter((mon) => mon.stats.atk),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'def',
      name: 'DEF',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.def.toString(),
      getFilterValue: (mon) => mon.stats.def.toString(),
      sortFunction: numericSorter((mon) => mon.stats.def),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'spa',
      name: 'SPA',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.spa.toString(),
      getFilterValue: (mon) => mon.stats.spa.toString(),
      sortFunction: numericSorter((mon) => mon.stats.spa),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'spd',
      name: 'SPD',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.spd.toString(),
      getFilterValue: (mon) => mon.stats.spd.toString(),
      sortFunction: numericSorter((mon) => mon.stats.spd),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'spe',
      name: 'SPE',
      width: '3.5rem',
      renderValue: (mon) => mon.stats.spe.toString(),
      getFilterValue: (mon) => mon.stats.spe.toString(),
      sortFunction: numericSorter((mon) => mon.stats.spe),
      cellClass: 'number-cell',
      noFilter: true,
    },
    {
      key: 'move_1',
      name: 'Move 1',
      width: '8rem',
      renderValue: (mon) => mon.move1 || '-',
      getFilterValue: (mon) => mon.move1 || '-',
      sortFunction: stringSorter((mon) => mon.move1 || '-'),
    },
    {
      key: 'move_2',
      name: 'Move 2',
      width: '8rem',
      renderValue: (mon) => mon.move2 || '-',
      getFilterValue: (mon) => mon.move2 || '-',
      sortFunction: stringSorter((mon) => mon.move2 || '-'),
    },
    {
      key: 'move_3',
      name: 'Move 3',
      width: '8rem',
      renderValue: (mon) => mon.move3 || '-',
      getFilterValue: (mon) => mon.move3 || '-',
      sortFunction: stringSorter((mon) => mon.move3 || '-'),
    },
    {
      key: 'move_4',
      name: 'Move 4',
      width: '8rem',
      renderValue: (mon) => mon.move4 || '-',
      getFilterValue: (mon) => mon.move4 || '-',
      sortFunction: stringSorter((mon) => mon.move4 || '-'),
    },
    {
      key: 'ribbons',
      name: 'Ribbons',
      width: '4rem',
      renderValue: (mon) => mon.ribbonCount ?? '',
      getFilterValue: (mon) =>
        mon.ribbonCount === 0
          ? '0'
          : mon.ribbonCount <= 3
            ? '1-3'
            : mon.ribbonCount <= 6
              ? '4-5'
              : '6+',
      sortFunction: numericSorter((mon) => mon.ribbonCount),
      cellClass: 'number-cell',
    },
    {
      key: 'homeID',
      name: 'OpenHome ID',
      minWidth: 240,
      sortFunction: stringSorter((mon) => mon.openhomeId),
      renderValue: (mon) => mon.openhomeId,
      cellClass: 'mono-cell',
      noFilter: true,
    },
  ]
}

export type LevelRangeBy10 =
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

function locationToSortableString(location: Option<BankBoxCoordinates>): string {
  if (!location) {
    return 'NO_LOCATION'
  }
  return `$${location.box.toString().padStart(3, '0')}~${location.boxSlot.toString().padStart(3, '0')}`
}
