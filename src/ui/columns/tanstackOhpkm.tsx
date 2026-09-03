/* eslint-disable react-refresh/only-export-components */
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import Badge from '@openhome-ui/components/badge/Badge'
import GenderIcon from '@openhome-ui/components/pokemon/GenderIcon'
import TypeIcon from '@openhome-ui/components/pokemon/TypeIcon'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { TABLE_FEATURES } from '@openhome-ui/components/TanstackTableUtil'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'

const columnHelper = createColumnHelper<typeof TABLE_FEATURES, OHPKM>()

export function useTanstackOhpkmColumns(onSelectMon: (mon: OHPKM) => void) {
  const columns = useMemo(
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
        columnHelper.accessor('metadata.type1Index', {
          header: 'Type 1',
          size: 3,
          cell: (props) => <TypeIconIfPresent typeIndex={props.getValue()} />,
        }),
        columnHelper.accessor('metadata.type2Index', {
          header: 'Type 2',
          size: 3,
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
        columnHelper.accessor('nature.name', {
          header: 'Nature',
          size: 8,
        }),
        columnHelper.accessor((mon) => mon.isShiny(), {
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
        columnHelper.accessor((mon) => mon.getLevel(), {
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
        // columnHelper.accessor('firstName', {
        //   cell: (info) => info.getValue(),
        // }),
        // columnHelper.accessor((row) => row.lastName, {
        //   id: 'lastName',
        //   cell: (info) => info.getValue(),
        //   header: () => <span>Last Name</span>,
        // }),
        // columnHelper.accessor('age', {
        //   header: () => 'Age',
        //   size: 50,
        // }),
        // columnHelper.accessor('visits', {
        //   header: () => <span>Visits</span>,
        //   size: 50,
        // }),
        // columnHelper.accessor('status', {
        //   header: 'Status',
        // }),
        // columnHelper.accessor('progress', {
        //   header: 'Profile Progress',
        //   size: 80,
        // }),
        // columnHelper.accessor('createdAt', {
        //   header: 'Created At',
        //   cell: (info) => info.getValue<Date>().toLocaleString(),
        //   size: 200,
        // }),
      ]),
    [onSelectMon]
  )

  return columns
}

function MonDisplayButton(props: { mon: OHPKM; onSelectMon?: (mon: OHPKM) => void }) {
  return (
    <div className="flex-row-centered">
      <button onClick={() => props.onSelectMon?.(props.mon)} className="mon-icon-button">
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
