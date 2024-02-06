import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'
import { GameOfOriginData } from 'pokemon-resources'
import { SaveRef } from 'src/types/types'
import { useRecentSaves } from '../redux/selectors'
import { filterEmpty, formatTimeSince, getSaveLogo } from './util'
import { ParsedPath, splitPath } from 'src/types/SAVTypes/path'
import { Stack } from '@mui/material'

interface SaveFileSelectorProps {
  onOpen: (path: ParsedPath) => void
}

export default function RecentSaves(props: SaveFileSelectorProps) {
  const { onOpen } = props
  const [recentSaves] = useRecentSaves()

  const columns: GridColDef<SaveRef>[] = [
    {
      field: 'open',
      headerName: 'Open',
      width: 80,
      align: 'center',

      renderCell: (params) => (
        <button
          onClick={(e) => {
            e.preventDefault()
            onOpen(params.row.filePath)
          }}
        >
          Open
        </button>
      ),
    },
    {
      field: 'game',
      headerName: 'Game',
      width: 130,
      align: 'center',
      renderCell: (params) => <img alt="save logo" height={50} src={getSaveLogo(params.value)} />,
      type: 'singleSelect',
      valueOptions: Object.values(GameOfOriginData)
        .filter(filterEmpty)
        .filter((origin) =>
          Object.values(recentSaves).some((save) => save.game == origin.index.toString())
        ),
      getOptionValue: (value: any) => value?.index?.toString(),
      getOptionLabel: (value: any) => value?.name,
    },
    {
      field: 'trainerDetails',
      headerName: 'Trainer',
      width: 160,
      type: 'singleSelect',
      valueOptions: Object.values(recentSaves).map(
        (save) => `${save.trainerName} (${save.trainerID})`
      ),
      valueGetter: (params: GridValueGetterParams<SaveRef>) =>
        `${params.row.trainerName} (${params.row.trainerID})`,
    },
    {
      field: 'lastOpened',
      headerName: 'Last Opened',
      width: 160,
      valueFormatter: (params) => formatTimeSince(params.value),
    },
    {
      field: 'filePath',
      headerName: 'Path',
      width: 500,
      renderCell: (params) => (
        <Stack
          display="flex"
          flexWrap="wrap"
          direction="row"
          spacing={0.5}
          useFlexGap
          title={params.value.raw}
          minHeight={'fit-content'}
          margin={1}
        >
          {splitPath(params.value).map((segment, i) => (
            <div key={`${params.value}_${i}`}>
              <span
                style={{
                  backgroundColor: '#3336',
                  borderRadius: 3,
                  padding: 3,
                  fontSize: segment === params.value.name ? 12 : 10,
                  color: 'white',
                  fontWeight: segment === params.value.name ? 'bold' : 'normal',
                }}
              >
                {segment}
              </span>
              {segment !== params.value.name && ' >'}
            </div>
          ))}
        </Stack>
      ),
    },
  ]

  return (
    <DataGrid
      rows={Object.values(recentSaves)}
      columns={columns}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 20 },
        },
        sorting: {
          sortModel: [{ field: 'lastOpened', sort: 'desc' }],
        },
      }}
      getRowId={(row) => row.filePath.raw}
      pageSizeOptions={[20, 50, 100]}
      rowSelection={false}
      // autoHeight={true}
      getRowHeight={() => 'auto'}
    />
  )
}
