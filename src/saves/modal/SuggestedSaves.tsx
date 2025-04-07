import { Flex } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { GameOfOrigin } from 'pokemon-resources'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import OHDataGrid, { SortableColumn } from 'src/components/OHDataGrid'
import useDisplayError from 'src/hooks/displayError'
import { AppInfoContext } from 'src/state/appInfo'
import { LookupContext } from 'src/state/lookup'
import { OpenSavesContext } from 'src/state/openSaves'
import { getSaveRef, SAV } from 'src/types/SAVTypes/SAV'
import { buildUnknownSaveFile } from 'src/types/SAVTypes/load'
import { PathData, splitPath } from 'src/types/SAVTypes/path'
import { filterUndefined, numericSorter } from 'src/util/Sort'
import { filterEmpty, getSaveLogo, SaveViewMode } from '../util'
import SaveCard from './SaveCard'

interface SaveFileSelectorProps {
  onOpen: (path: PathData) => void
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
  const [error, setError] = useState(false)
  const displayError = useDisplayError()

  const handleError = useCallback(
    (title: string, messages: string | string[]) => {
      setError(true)
      displayError(title, messages)
    },
    [displayError]
  )

  const openSavePaths = useMemo(
    () => Object.fromEntries(Object.values(openSaves).map((save) => [save.filePath.raw, true])),
    [openSaves]
  )

  const loadSaveData = useCallback(
    async (savePath: PathData) => {
      const response = await backend.loadSaveFile(savePath)

      if (E.isRight(response)) {
        const { fileBytes } = response.right

        return buildUnknownSaveFile(
          savePath,
          fileBytes,
          {
            homeMonMap,
            gen12LookupMap,
            gen345LookupMap,
          },
          getEnabledSaveTypes()
        )
      }
      return undefined
    },
    [backend, gen12LookupMap, gen345LookupMap, getEnabledSaveTypes, homeMonMap]
  )

  useEffect(() => {
    if (error || suggestedSaves) return
    backend.findSuggestedSaves().then(
      E.match(
        (err) => handleError('Error getting suggested saves', err),
        async (possibleSaves) => {
          const allPaths = (possibleSaves?.citra ?? [])
            .concat(possibleSaves?.open_emu ?? [])
            .concat(possibleSaves?.desamume ?? [])

          if (allPaths.length > 0) {
            const saves = (await Promise.all(allPaths.map((path) => loadSaveData(path)))).filter(
              filterEmpty
            )

            saves.filter(E.isLeft).forEach((s) => console.warn(`Suggested save error: ${s.left}`))

            setSuggestedSaves(
              saves
                .filter(E.isRight)
                .map((s) => s.right)
                .filter(filterUndefined)
            )
          }
        }
      )
    )
  }, [backend, error, handleError, loadSaveData, suggestedSaves])

  const saveTypeFromOrigin = useCallback(
    (origin: number | undefined) =>
      origin
        ? getEnabledSaveTypes().find((s) => s.includesOrigin(origin as GameOfOrigin))
        : undefined,
    [getEnabledSaveTypes]
  )

  const columns: SortableColumn<SAV>[] = [
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
    <OHDataGrid rows={suggestedSaves ?? []} columns={columns} />
  ) : (
    <Flex wrap="wrap" direction="row" justify="center" m="4" gap="2">
      {suggestedSaves?.map((save) => (
        <SaveCard
          key={save.filePath.raw}
          save={getSaveRef(save)}
          onOpen={() => {
            onOpen(save.filePath)
          }}
          size={cardSize}
        />
      ))}
    </Flex>
  )
}
