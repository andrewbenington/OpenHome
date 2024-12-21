import { DialogActions, Modal, ModalDialog, Stack, Typography } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { GameOfOrigin } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PathData, splitPath } from 'src/types/SAVTypes/path'
import { getPluginIdentifier } from 'src/types/SAVTypes/util'
import { SaveRef } from 'src/types/types'
import { filterUndefined, numericSorter } from 'src/util/Sort'
import { BackendContext } from '../backend/backendContext'
import { ErrorIcon } from '../components/Icons'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import { AppInfoContext } from '../state/appInfo'
import { ErrorContext } from '../state/error'
import { OpenSavesContext } from '../state/openSaves'
import SaveCard from './SaveCard'
import SaveDetailsMenu from './SaveDetailsMenu'
import { formatTime, formatTimeSince, getSaveLogo, SaveViewMode } from './util'

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
  const [error, setError] = useState<string>()
  const [, dispatchErrorState] = useContext(ErrorContext)

  const openSavePaths = useMemo(
    () => Object.fromEntries(openSaves.map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  const getRecentSaves = useCallback(() => {
    backend.getRecentSaves().then(
      E.match(
        (err) =>
          dispatchErrorState({
            type: 'set_message',
            payload: { title: 'Error Getting Recents', messages: [err] },
          }),
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
  }, [backend, dispatchErrorState, getEnabledSaveTypes])

  const removeRecentSave = useCallback(
    (path: string) =>
      backend.removeRecentSave(path).then(
        E.match(
          async (err) => {
            setError(err)
          },
          () => getRecentSaves()
        )
      ),
    [backend, getRecentSaves]
  )

  const saveTypeFromOrigin = useCallback(
    (origin: number | undefined) =>
      origin
        ? getEnabledSaveTypes().find((s) => s.includesOrigin(origin as GameOfOrigin))
        : undefined,
    [getEnabledSaveTypes]
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
              dispatchErrorState({
                type: 'set_message',
                payload: {
                  title: 'Invalid Save',
                  messages: ['File is missing, renamed, or inaccessbile'],
                },
              })
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
            src={getSaveLogo(saveTypeFromOrigin(value.game), value.game as GameOfOrigin)}
          />
        ) : (
          ''
        ),
      sortFunction: numericSorter((val) => val.game ?? -1),
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
        <Stack
          flexWrap="wrap"
          direction="row"
          spacing={0.5}
          useFlexGap
          title={save.filePath.raw}
          alignItems="start"
          paddingTop={0.5}
        >
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
        </Stack>
      ),
    },
  ]

  return (
    <>
      {view === 'grid' ? (
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
        <Stack flexWrap="wrap" direction="row" useFlexGap justifyContent="center" margin={2}>
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
        </Stack>
      )}
      <Modal open={!!error} onClose={() => setError(undefined)}>
        <ModalDialog>
          <Typography>{error}</Typography>
          <DialogActions>
            <button onClick={() => setError(undefined)}>OK</button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  )
}
