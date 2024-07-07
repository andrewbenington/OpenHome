import { ParsedPath } from 'src/types/SAVTypes/path'
import { SaveRef } from 'src/types/types'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import { useRecentSaves } from '../redux/selectors'
import { formatTimeSince, getSaveLogo } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: ParsedPath) => void
}

export default function RecentSaves(props: SaveFileSelectorProps) {
  const { onOpen } = props
  const [recentSaves] = useRecentSaves()

  console.log(Object.values(recentSaves).map((save, i) => ({ ...save, index: i })))
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
        >
          Open
        </button>
      ),
    },
    {
      key: 'game',
      name: 'Game',
      width: 130,
      // renderCell: (params) => <img alt="save logo" height={50} src={getSaveLogo(params.value)} />,
      // valueOptions: Object.values(GameOfOriginData)
      //   .filter(filterEmpty)
      //   .filter((origin) =>
      //     Object.values(recentSaves).some((save) => save.game == origin.index.toString())
      //   ),
      // getOptionValue: (value: any) => value?.index?.toString(),
      renderValue: (value) => <img alt="save logo" height={50} src={getSaveLogo(value.game)} />,
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
    },
    // {
    //   key: 'filePath',
    //   name: 'Path',
    //   width: 500,
    //   renderValue: (save) => (
    //     <Stack
    //       display="flex"
    //       flexWrap="wrap"
    //       direction="row"
    //       spacing={0.5}
    //       useFlexGap
    //       title={save.filePath.raw}
    //       minHeight={'fit-content'}
    //       margin={1}
    //     >
    //       {splitPath(save.filePath).map((segment, i) => (
    //         <div key={`${save.filePath.raw}_${i}`}>
    //           <span
    //             style={{
    //               backgroundColor: '#3336',
    //               borderRadius: 3,
    //               padding: 3,
    //               fontSize: segment === save.filePath.name ? 12 : 10,
    //               color: 'white',
    //               fontWeight: segment === save.filePath.name ? 'bold' : 'normal',
    //             }}
    //           >
    //             {segment}
    //           </span>
    //           {segment !== save.filePath.name && ' >'}
    //         </div>
    //       ))}
    //     </Stack>
    //   ),
    // },
  ]

  return (
    <OHDataGrid
      rows={Object.values(recentSaves).map((save, i) => ({ ...save, index: i }))}
      columns={columns}
      // initialState={{
      //   pagination: {
      //     paginationModel: { page: 0, pageSize: 20 },
      //   },
      //   sorting: {
      //     sortModel: [{ field: 'lastOpened', sort: 'desc' }],
      //   },
      // }}
      // getRowId={(row) => `${row.filePath.raw}-${row.index}`}
      // pageSizeOptions={[20, 50, 100]}
      // rowSelection={false}
      // autoHeight={true}
      // getRowHeight={() => 'auto'}
    />
  )
}
