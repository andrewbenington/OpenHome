import { DialogActions, Modal, ModalDialog, Stack, Typography } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { GameOfOrigin } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PathData, splitPath } from 'src/types/SAVTypes/path'
import { SaveRef } from 'src/types/types'
import { numericSorter } from '../../util/Sort'
import { BackendContext } from '../backend/backendProvider'
import { RemoveIcon } from '../components/Icons'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import { AppInfoContext } from '../state/appInfo'
import { OpenSavesContext } from '../state/openSaves'
import SaveCard from './SaveCard'
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

  const openSavePaths = useMemo(
    () => Object.fromEntries(openSaves.map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  const getRecentSaves = useCallback(() => {
    backend.getRecentSaves().then(
      E.match(
        (err) => console.error(err),
        (recents) => setRecentSaves(recents)
      )
    )
  }, [backend])

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
      key: 'open',
      name: 'Open',
      width: 80,
      renderCell: (params) => (
        <button
          onClick={(e) => {
            e.preventDefault()
            onOpen(params.row.filePath)
          }}
          disabled={!params.row.valid || params.row.filePath.raw in openSavePaths}
        >
          Open
        </button>
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'game',
      name: 'Game',
      width: 130,
      renderValue: (value) => (
        <img
          alt="save logo"
          height={40}
          src={getSaveLogo(saveTypeFromOrigin(value.game), value.game as GameOfOrigin)}
        />
      ),
      sortFunction: numericSorter((val) => val.game),
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
      renderValue: (save) => formatTimeSince(save.lastOpened),
      sortFunction: numericSorter((val) => val.lastOpened),
    },
    {
      key: 'lastModified',
      name: 'Last Modified',
      width: 240,
      renderValue: (save) => formatTime(save.lastModified),
      sortFunction: numericSorter((val) => val.lastModified),
    },
    {
      key: 'remove',
      name: '',
      width: 40,
      renderCell: (params) => (
        <button
          style={{
            padding: 0,
            display: 'grid',
            marginLeft: 'auto',
            marginTop: 'auto',
            marginBottom: 'auto',
            backgroundColor: '#990000',
            height: 'fit-content',
            borderRadius: 16,
          }}
          onClick={() => removeRecentSave(params.row.filePath.raw)}
        >
          <RemoveIcon />
        </button>
      ),
      cellClass: 'centered-cell',
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
          rows={Object.values(recentSaves ?? {}).map((save, i) => ({ ...save, index: i }))}
          columns={columns}
          defaultSort="lastOpened"
          defaultSortDir="DESC"
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
