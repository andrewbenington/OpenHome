import { Stack } from '@mui/material'
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid'
import { PKM } from 'pokemon-files'
import { useEffect, useState } from 'react'
import { SAV } from 'src/types/SAVTypes'
import { buildSaveFile } from 'src/types/SAVTypes/util'
import { ParsedPath, PossibleSaves, splitPath } from '../../types/SAVTypes/path'
import { useLookupMaps } from '../redux/selectors'
import { filterEmpty, getSaveLogo } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: ParsedPath) => void
}

export default function SuggestedSaves(props: SaveFileSelectorProps) {
  const { onOpen } = props
  const [suggestedSaves, setSuggestedSaves] = useState<SAV<PKM>[]>()
  const [homeMonMap, gen12LookupMap, gen345LookupMap] = useLookupMaps()

  const loadSaveData = async (savePath: ParsedPath) => {
    console.log(savePath)
    const { fileBytes, createdDate } = await window.electron.ipcRenderer.invoke('read-save-file', [
      savePath,
    ])
    return buildSaveFile(savePath, fileBytes, {
      homeMonMap,
      gen12LookupMap,
      gen345LookupMap,
      fileCreatedDate: createdDate,
    })
  }

  useEffect(() => {
    window.electron.ipcRenderer.invoke('find-saves').then(async (possibleSaves: PossibleSaves) => {
      const allPaths = possibleSaves.citra
        .concat(possibleSaves.openEmu)
        .concat(possibleSaves.desamume)
      if (allPaths.length > 0) {
        const saves = await Promise.all(allPaths.map((path) => loadSaveData(path)))
        setSuggestedSaves(saves.filter(filterEmpty))
      }
    })
  }, [])

  const columns: GridColDef[] = [
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
          disabled={params.row.tooEarlyToOpen}
        >
          Open
        </button>
      ),
    },
    {
      field: 'origin',
      headerName: 'Game',
      width: 130,
      align: 'center',
      renderCell: (params) => <img alt="save logo" height={50} src={getSaveLogo(params.value)} />,
      // type: 'singleSelect',
      // valueOptions: Object.values(GameOfOriginData)
      //   .filter(filterEmpty)
      //   .filter((origin) =>
      //     Object.values(suggestedSaves).some((save) => save.game == origin.index.toString())
      //   ),
      // getOptionValue: (value: any) => value?.index?.toString(),
      // getOptionLabel: (value: any) => value?.name,
    },
    {
      field: 'trainerDetails',
      headerName: 'Trainer',
      width: 160,
      // type: 'singleSelect',
      // valueOptions: Object.values(suggestedSaves).map(
      //   (save) => `${save.trainerName} (${save.trainerID})`
      // ),
      valueGetter: (params: GridValueGetterParams<SAV<PKM>>) =>
        `${params.row.name} (${params.row.tid})`,
    },
    // {
    //   field: 'lastOpened',
    //   headerName: 'Last Opened',
    //   width: 160,
    //   valueFormatter: (params) => formatTimeSince(params.value),
    // },
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
      rows={suggestedSaves ?? []}
      columns={columns}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 20 },
        },
      }}
      getRowId={(row) => row.filePath.raw}
      pageSizeOptions={[20, 50, 100]}
      rowSelection={false}
      // autoHeight={true}
      getRowHeight={() => 'auto'}
      loading={suggestedSaves === undefined}
    />
  )
}
