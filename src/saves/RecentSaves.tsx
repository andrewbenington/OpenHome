import { OriginGames } from '@pkm-rs-resources/pkg'
import { Flex } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PathData, splitPath } from 'src/types/SAVTypes/path'
import { getPluginIdentifier } from 'src/types/SAVTypes/util'
import { SaveRef } from 'src/types/types'
import { filterUndefined, numericSorter, stringSorter } from 'src/util/Sort'
import { BackendContext } from '../backend/backendContext'
import { ErrorIcon } from '../components/Icons'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import useDisplayError from '../hooks/displayError'
import { AppInfoContext } from '../state/appInfo'
import { OpenSavesContext } from '../state/openSaves'
import SaveCard from './SaveCard'
import SaveDetailsMenu from './SaveDetailsMenu'
import { formatTime, formatTimeSince, SaveViewMode } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: PathData) => void
  view: SaveViewMode
  cardSize: number
}

export default function RecentSaves(props: SaveFileSelectorProps) {
  const { onOpen, view, cardSize } = props
  const backend = useContext(BackendContext)
  const [recentSaves, setRecentSaves] = useState<Record<string, SaveRef>>()
  const [, , openSaves] = useContext(OpenSavesContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const displayError = useDisplayError()

  const openSavePaths = useMemo(
    () => Object.fromEntries(openSaves.map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  const getRecentSaves = useCallback(() => {
    backend.getRecentSaves().then(
      E.match(
        (err) => {
          displayError('Error Getting Recents', err)
          setRecentSaves({})
        },
        (recents) => {
          const extraSaveIdentifiers = getEnabledSaveTypes()
            .map(getPluginIdentifier)
            .filter(filterUndefined)

          // filter out saves from plugins that aren't enabled
          const filteredRecents = Object.entries(recents).filter(
            ([, ref]) =>
              ref.pluginIdentifier === null || extraSaveIdentifiers.includes(ref.pluginIdentifier)
          )

          setRecentSaves(Object.fromEntries(filteredRecents))
        }
      )
    )
  }, [backend, displayError, getEnabledSaveTypes])

  const removeRecentSave = useCallback(
    (path: string) =>
      backend.removeRecentSave(path).then(
        E.match(
          async (err) => {
            displayError('Could Not Remove Save', err)
          },
          () => getRecentSaves()
        )
      ),
    [backend, getRecentSaves, displayError]
  )

  useEffect(() => {
    if (!recentSaves) {
      getRecentSaves()
    }
  }, [getRecentSaves, recentSaves])

  const columns: SortableColumn<SaveRef>[] = [
    {
      key: 'menu',
      name: '',
      width: 50,
      renderCell: (params) => (
        <SaveDetailsMenu
          save={params.row}
          onRemove={() => removeRecentSave(params.row.filePath.raw)}
        />
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'open',
      name: '',
      width: 80,
      renderCell: (params) =>
        params.row.valid ? (
          <button
            className="save-grid-open-button"
            onClick={(e) => {
              e.preventDefault()
              onOpen(params.row.filePath)
            }}
            disabled={params.row.filePath.raw in openSavePaths}
            title={params.row.filePath.raw in openSavePaths ? 'Save is already open' : undefined}
          >
            Open
          </button>
        ) : (
          <button
            className="save-grid-error-button"
            onClick={() =>
              displayError('Invalid Save', 'File is missing, renamed, or inaccessbile')
            }
          >
            <ErrorIcon style={{ width: 20, height: 20 }} />
          </button>
        ),
      cellClass: 'centered-cell',
    },
    {
      key: 'game',
      name: 'Game',
      width: 130,
      renderValue: (value) =>
        value.game ? (
          <img
            alt="save logo"
            height={40}
            src={
              value.pluginIdentifier
                ? `logos/${value.pluginIdentifier}.png`
                : OriginGames.logoPath(value.game)
            }
          />
        ) : (
          ''
        ),
      sortFunction: numericSorter((val) => val.game ?? -1),
      cellClass: 'centered-cell',
    },
    {
      key: 'game_origin',
      name: 'Origin',
      width: 130,
      renderValue: (value) => value.game,
      sortFunction: numericSorter((val) => val.game ?? -1),
      cellClass: 'centered-cell',
    },
    {
      key: 'pluginIdentifier',
      name: 'Plugin',
      width: 130,
      sortFunction: stringSorter((val) => val.pluginIdentifier ?? ''),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerDetails',
      name: 'Trainer',
      width: 160,
      renderValue: (save) => `${save.trainerName} (${save.trainerID})`,
    },
    {
      key: 'lastOpened',
      name: 'Last Opened',
      width: 160,
      renderValue: (save) => (save.lastOpened ? formatTimeSince(save.lastOpened) : ''),
      sortFunction: numericSorter((val) => val.lastOpened ?? -1),
    },
    {
      key: 'lastModified',
      name: 'Last Modified',
      width: 240,
      renderValue: (save) => (save.lastModified ? formatTime(save.lastModified) : ''),
      sortFunction: numericSorter((val) => val.lastModified ?? -1),
    },
    {
      key: 'filePath',
      name: 'Path',
      minWidth: 300,
      renderValue: (save) => (
        <Flex wrap="wrap" direction="row" gap="1" title={save.filePath.raw} align="start" mt="1">
          {splitPath(save.filePath).map((segment, i) => (
            <div
              key={`${save.filePath.raw}_${i}`}
              style={{
                borderRadius: 3,
                fontSize: segment === save.filePath.name ? 12 : 10,
                fontWeight: segment === save.filePath.name ? 'bold' : 'normal',
                lineHeight: 1,
              }}
            >
              {segment}
              {segment !== save.filePath.name && ' >'}
            </div>
          ))}
        </Flex>
      ),
    },
  ]

  return view === 'grid' ? (
    <OHDataGrid
      rows={Object.values(recentSaves ?? {}).map((save, i) => ({
        ...save,
        index: i,
      }))}
      columns={columns}
      defaultSort="lastOpened"
      defaultSortDir="DESC"
      rowClass={(row) => (row.valid ? undefined : 'datagrid-error-row')}
    />
  ) : (
    <Flex wrap="wrap" direction="row" justify="center" m="4" gap="2">
      {Object.values(recentSaves ?? {})
        .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0))
        .map((save) => (
          <SaveCard
            key={save.filePath.raw}
            save={save}
            onOpen={() => {
              onOpen(save.filePath)
            }}
            onRemove={() => removeRecentSave(save.filePath.raw)}
            size={cardSize}
          />
        ))}
    </Flex>
  )
}
