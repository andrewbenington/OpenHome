import { Stack } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { GameOfOrigin } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSaveRef, SAV } from 'src/types/SAVTypes/SAV'
import { buildSaveFile } from 'src/types/SAVTypes/load'
import { ParsedPath, splitPath } from '../../types/SAVTypes/path'
import { numericSorter } from '../../util/Sort'
import { BackendContext } from '../backend/backendProvider'
import OHDataGrid, { SortableColumn } from '../components/OHDataGrid'
import { AppInfoContext } from '../state/appInfo'
import { LookupContext } from '../state/lookup'
import { OpenSavesContext } from '../state/openSaves'
import SaveCard from './SaveCard'
import { filterEmpty, getSaveLogo, SaveViewMode } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: ParsedPath) => void
  view: SaveViewMode
  cardSize: number
}

export default function SuggestedSaves(props: SaveFileSelectorProps) {
  const { onOpen, view, cardSize } = props
  const backend = useContext(BackendContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [suggestedSaves, setSuggestedSaves] = useState<SAV[]>()
  const [{ homeMons: homeMonMap, gen12: gen12LookupMap, gen345: gen345LookupMap }] =
    useContext(LookupContext)
  const [, , openSaves] = useContext(OpenSavesContext)

  const openSavePaths = useMemo(
    () => Object.fromEntries(Object.values(openSaves).map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  const loadSaveData = useCallback(
    async (savePath: ParsedPath) => {
      const response = await backend.loadSaveFile(savePath)
      if (E.isRight(response)) {
        const { fileBytes, createdDate } = response.right
        return buildSaveFile(
          savePath,
          fileBytes,
          {
            homeMonMap,
            gen12LookupMap,
            gen345LookupMap,
            fileCreatedDate: createdDate,
          },
          getEnabledSaveTypes()
        )
      }
      return undefined
    },
    [backend, gen12LookupMap, gen345LookupMap, homeMonMap]
  )

  useEffect(() => {
    backend.findSuggestedSaves().then(
      E.match(
        (err) => console.error(err),
        async (possibleSaves) => {
          const allPaths = possibleSaves.citra
            .concat(possibleSaves.openEmu)
            .concat(possibleSaves.desamume)
          if (allPaths.length > 0) {
            const saves = (await Promise.all(allPaths.map((path) => loadSaveData(path)))).filter(
              filterEmpty
            )
            setSuggestedSaves(saves)
          }
        }
      )
    )
  }, [backend, loadSaveData])

  const saveTypeFromOrigin = useCallback(
    (origin: number | undefined) =>
      origin
        ? getEnabledSaveTypes().find((s) => s.includesOrigin(origin as GameOfOrigin))
        : undefined,
    [getEnabledSaveTypes]
  )

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
          disabled={params.row.tooEarlyToOpen || params.row.filePath.raw in openSavePaths}
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
          src={getSaveLogo(saveTypeFromOrigin(value.origin), value.origin as GameOfOrigin)}
        />
      ),
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

  return view === 'grid' ? (
    <OHDataGrid rows={suggestedSaves ?? []} columns={columns} />
  ) : (
    <Stack flexWrap="wrap" direction="row" useFlexGap justifyContent="center" margin={2}>
      {suggestedSaves?.map((save) => (
        <SaveCard
          save={getSaveRef(save)}
          onOpen={() => {
            onOpen(save.filePath)
          }}
          size={cardSize}
        />
      ))}
    </Stack>
  )
}
