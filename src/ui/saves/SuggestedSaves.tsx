import { getSaveRef, SAV } from '@openhome/core/save/interfaces'
import { buildUnknownSaveFile } from '@openhome/core/save/util/load'
import { PathData, splitPath } from '@openhome/core/save/util/path'
import { AppInfoContext } from '@openhome/ui/state/appInfo'
import { useLookups } from '@openhome/ui/state/lookups'
import { useOhpkmStore } from '@openhome/ui/state/ohpkm/useOhpkmStore'
import { useSaves } from '@openhome/ui/state/saves/useSaves'
import { Flex } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import OHDataGrid, { SortableColumn } from 'src/ui/components/OHDataGrid'
import useDisplayError from 'src/ui/hooks/displayError'
import { filterUndefined, numericSorter, stringSorter } from 'src/util/Sort'
import SaveCard from './SaveCard'
import { filterEmpty, SaveViewMode } from './util'

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
  const ohpkmStore = useOhpkmStore()
  const { getLookups } = useLookups()
  const savesAndBanks = useSaves()
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
    () => Object.fromEntries(savesAndBanks.allOpenSaves.map((save) => [save.filePath.raw, true])),
    [savesAndBanks.allOpenSaves]
  )

  const loadSaveData = useCallback(
    async (savePath: PathData) => {
      const response = await backend.loadSaveFile(savePath)
      const lookupsResponse = await getLookups()

      if (E.isLeft(lookupsResponse)) {
        console.error(lookupsResponse.left)
        handleError('Error loading lookups', lookupsResponse.left)
        return
      }

      const lookups = lookupsResponse.right

      if (E.isRight(response)) {
        const { fileBytes } = response.right

        return buildUnknownSaveFile(
          savePath,
          fileBytes,
          {
            getOhpkmById: ohpkmStore.getById,
            gen12LookupMap: lookups.gen12,
            gen345LookupMap: lookups.gen345,
          },
          getEnabledSaveTypes()
        )
      }
      return undefined
    },
    [backend, getEnabledSaveTypes, getLookups, handleError, ohpkmStore.getById]
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
      renderValue: (value) => {
        return value.gameLogoPath ? (
          <img alt="save logo" height={40} src={value.gameLogoPath} />
        ) : (
          <div>{value.gameName}</div>
        )
      },
      sortFunction: numericSorter((val) => val.origin),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerDetails',
      name: 'Trainer',
      width: 160,
      renderValue: (params) => `${params.name} (${params.tid})`,
      sortFunction: stringSorter((save) => `${save.name} (${save.tid})`),
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
          onOpen={() => onOpen(save.filePath)}
          size={cardSize}
        />
      ))}
    </Flex>
  )
}
