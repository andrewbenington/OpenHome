import { Stack } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useContext, useEffect, useMemo, useState } from 'react'
import { ParsedPath, splitPath } from 'src/types/SAVTypes/path'
import { SaveRef } from 'src/types/types'
import { numericSorter } from '../../util/Sort'
import { BackendContext } from '../backend/backendProvider'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import { OpenSavesContext } from '../state/openSaves'
import { formatTime, formatTimeSince, getSaveLogo } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: ParsedPath) => void
}

export default function RecentSaves(props: SaveFileSelectorProps) {
  const { onOpen } = props
  const backend = useContext(BackendContext)
  const [recentSaves, setRecentSaves] = useState<Record<string, SaveRef>>()
  const [, , openSaves] = useContext(OpenSavesContext)

  const openSavePaths = useMemo(
    () => Object.fromEntries(openSaves.map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  useEffect(() => {
    if (!recentSaves) {
      backend.getRecentSaves().then(
        E.match(
          (err) => console.error(err),
          (recents) => setRecentSaves(recents)
        )
      )
    }
  }, [backend, recentSaves])

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
      renderValue: (value) => <img alt="save logo" height={40} src={getSaveLogo(value.game)} />,
      sortFunction: numericSorter((val) => (val.game ? parseInt(val.game) : undefined)),
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
    <OHDataGrid
      rows={Object.values(recentSaves ?? {}).map((save, i) => ({ ...save, index: i }))}
      columns={columns}
      defaultSort="lastOpened"
      defaultSortDir="DESC"
    />
  )
}
