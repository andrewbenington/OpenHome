/* eslint-disable react-refresh/only-export-components */
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Moves } from '@openhome-core/resources'
import { Option } from '@openhome-core/util/functional'
import { $O } from '@openhome-core/util/option'
import Badge from '@openhome-ui/components/badge/Badge'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { SortableTableColumn } from '@openhome-ui/components/SortableTable'
import { TABLE_FEATURES } from '@openhome-ui/components/TanstackTableUtil'
import { getPublicImageURL } from '@openhome-ui/images/images'
import {
  BankBoxCoordinates,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<typeof TABLE_FEATURES, OhpkmRowData>()

export type OhpkmRowData = Pick<
  OHPKM,
  | 'nationalDex'
  | 'formIndex'
  | 'openhomeId'
  | 'nickname'
  | 'mostRecentSaveWasm'
  | 'gameOfOrigin'
  | 'pluginOrigin'
  | 'trainerName'
  | 'startedTrackingTimestamp'
  | 'stats'
  | 'gender'
> & {
  type1Index: Option<number>
  type2Index: Option<number>
  natureName: string
  isShiny: boolean
  level: number
  move1: Option<string>
  move2: Option<string>
  move3: Option<string>
  move4: Option<string>
  ribbonCount: Option<number>
  homeLocation: Option<BankBoxCoordinates>
}

export function toRowData(
  mon: OHPKM,
  findHomeLocation: (identifier: string) => Option<BankBoxCoordinates>,
  _releasingIds: string[]
): OhpkmRowData {
  const metadata = mon.metadata
  return {
    nationalDex: mon.nationalDex,
    formIndex: mon.formIndex,
    openhomeId: mon.openhomeId,
    nickname: mon.nickname,
    mostRecentSaveWasm: mon.mostRecentSaveWasm,
    gameOfOrigin: mon.gameOfOrigin,
    pluginOrigin: mon.pluginOrigin,
    trainerName: mon.trainerName,
    startedTrackingTimestamp: mon.startedTrackingTimestamp,
    stats: mon.stats,
    type1Index: metadata?.type1Index,
    type2Index: metadata?.type2Index,
    natureName: mon.nature.name,
    isShiny: mon.isShiny(),
    gender: mon.gender,
    level: mon.getLevel(),
    move1: mon.moves[0] ? Moves[mon.moves[0]].name : undefined,
    move2: mon.moves[1] ? Moves[mon.moves[1]].name : undefined,
    move3: mon.moves[2] ? Moves[mon.moves[2]].name : undefined,
    move4: mon.moves[3] ? Moves[mon.moves[3]].name : undefined,
    ribbonCount: mon.ribbons.length ?? 0,
    homeLocation: findHomeLocation(mon.openhomeId),
  }
}

export function useTanstackOhpkmColumnsPrecomputed(
  onSelectMon: (openhomeId: OhpkmIdentifier) => void
) {
  const { getBankName, getBoxName } = useBanksAndBoxes()

  const columns: SortableTableColumn<OhpkmRowData>[] = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((mon) => mon, {
          header: 'Mon',
          size: 2,
          cell: (props) => <MonDisplayButton mon={props.getValue()} onSelectMon={onSelectMon} />,
        }),
        columnHelper.accessor('nickname', {
          header: 'Nickname',
          size: 10,
        }),
        columnHelper.accessor('type1Index', {
          header: 'Type 1',
          size: 3.5,
          cell: (props) => <TypeIconIfPresent typeIndex={props.getValue()} />,
        }),
        columnHelper.accessor('type2Index', {
          header: 'Type 2',
          size: 3.5,
          cell: (props) => <TypeIconIfPresent typeIndex={props.getValue()} />,
        }),
        columnHelper.accessor('openhomeId', {
          header: 'ID',
          size: 12,
          cell: (props) => (
            <div className="mono-cell" style={{ textWrap: 'nowrap' }}>
              {props.getValue()}
            </div>
          ),
        }),
        columnHelper.accessor('homeLocation', {
          id: 'home_bank',
          header: 'Home Bank',
          size: 12,
          cell: (props) => (
            <div className="mono-cell" style={{ textWrap: 'nowrap' }}>
              {$O(props.getValue())
                .map((location) => getBankName(location.bank))
                .get()}
            </div>
          ),
        }),
        columnHelper.accessor('homeLocation', {
          id: 'home_box',
          header: 'Home Box',
          size: 12,
          cell: (props) => (
            <div className="mono-cell" style={{ textWrap: 'nowrap' }}>
              {$O(props.getValue())
                .map((location) => getBoxName(location.bank, location.box))
                .get()}
            </div>
          ),
        }),
        columnHelper.accessor('mostRecentSaveWasm', {
          header: 'Recent Save',
          size: 8,
          cell: (props) => (
            <div className="flex-row-centered">
              <Badge.Game
                originGame={props.getValue()?.game}
                withName
                tooltip={props.getValue()?.file_path}
              />
            </div>
          ),
        }),
        columnHelper.accessor(
          (mon) => ({ originGame: mon.gameOfOrigin, pluginOrigin: mon.pluginOrigin }),
          {
            header: 'Origin Game',
            size: 8,
            cell: (props) => (
              <div className="flex-row-centered">
                <Badge.Game
                  originGame={props.getValue()?.originGame}
                  withName
                  tooltip={props.getValue()?.pluginOrigin}
                />
              </div>
            ),
          }
        ),
        columnHelper.accessor('startedTrackingTimestamp', {
          header: 'First Tracked',
          size: 8,
          cell: (props) => props.getValue()?.format('MMM DD, YYYY'),
        }),
        columnHelper.accessor('trainerName', {
          header: 'Original Trainer',
          size: 8,
        }),
        columnHelper.accessor('natureName', {
          header: 'Nature',
          size: 8,
        }),
        columnHelper.accessor('isShiny', {
          header: 'Shiny',
          size: 4,
          cell: (props) =>
            props.getValue() ? (
              <img
                className="grid-shiny-icon invert-light"
                alt="shiny icon"
                draggable={false}
                src={getPublicImageURL('icons/Shiny.png')}
              />
            ) : null,
        }),
        columnHelper.accessor('gender', {
          header: 'Gender',
          size: 4,
          cell: (props) => <GenderIcon gender={props.getValue()} />,
        }),
        columnHelper.accessor('level', {
          header: 'Level',
          size: 4,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.hp', {
          header: 'HP',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.atk', {
          header: 'Atk',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.def', {
          header: 'Def',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.spa', {
          header: 'SpA',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.spd', {
          header: 'SpD',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('stats.spe', {
          header: 'Spe',
          size: 2,
          cell: (props) => <span className="mono-cell">{props.getValue()}</span>,
        }),
        columnHelper.accessor('move1', {
          header: 'Move 1',
          size: 6,
        }),
        columnHelper.accessor('move2', {
          header: 'Move 2',
          size: 6,
        }),
        columnHelper.accessor('move3', {
          header: 'Move 3',
          size: 6,
        }),
        columnHelper.accessor('move4', {
          header: 'Move 4',
          size: 6,
        }),
        columnHelper.accessor('ribbonCount', {
          header: 'Ribbons',
          size: 6,
        }),
      ]),
    [getBankName, getBoxName, onSelectMon]
  )

  return columns
}

function MonDisplayButton(props: {
  mon: OhpkmRowData
  onSelectMon?: (openhomeId: OhpkmIdentifier) => void
}) {
  return (
    <div className="flex-row-centered">
      <button onClick={() => props.onSelectMon?.(props.mon.openhomeId)} className="mon-icon-button">
        <PokemonIcon
          nationalDex={props.mon.nationalDex}
          formIndex={props.mon.formIndex}
          style={{ height: '1.75rem', width: '1.75rem' }}
        />
      </button>
    </div>
  )
}

function TypeIconIfPresent(props: { typeIndex?: number }) {
  return props.typeIndex !== undefined ? (
    <div className="flex-row-centered">
      <TypeIcon size="1.5rem" typeIndex={props.typeIndex} />
    </div>
  ) : null
}
