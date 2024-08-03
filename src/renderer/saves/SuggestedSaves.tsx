import { Stack } from '@mui/material'
import { PKM } from 'pokemon-files'
import { useEffect, useState } from 'react'
import { SAV } from 'src/types/SAVTypes'
import { buildSaveFile } from 'src/types/SAVTypes/util'
import { ParsedPath, PossibleSaves, splitPath } from '../../types/SAVTypes/path'
import { numericSorter } from '../../util/Sort'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
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

  const columns: SortableColumn<SAV>[] = [
    // {
    //   key: 'display',
    //   name: 'Display',
    //   width: 80,

    //   renderCell: (params) => <DevDataDisplay data={params.row} />,
    //   cellClass: 'centered-cell',
    // },
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
          disabled={params.row.tooEarlyToOpen}
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
      renderValue: (value) => <img alt="save logo" height={40} src={getSaveLogo(value.origin)} />,
      sortFunction: numericSorter((val) => val.origin),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerDetails',
      name: 'Trainer',
      width: 160,
      renderValue: (params) => `${params.name} (${params.tid})`,
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

  return <OHDataGrid rows={suggestedSaves ?? []} columns={columns} />
}
