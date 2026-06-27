import { buildUnknownSaveFile } from '@openhome-core/save/util/load'
import { PathData, splitPath } from '@openhome-core/save/util/path'
import { R } from '@openhome-core/util/functional'
import { SortableColumn } from '@openhome-core/util/sort'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { Flex } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useState } from 'react'
import SaveSuggestionCard, { SaveSuggestion } from './SaveSuggestionCard'
import { SaveViewMode } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: PathData) => void
  view: SaveViewMode
  cardSize: number
}

export default function SuggestedSaves(props: SaveFileSelectorProps) {
  const { onOpen, view, cardSize } = props
  const backend = useContext(BackendContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [suggestedSaves, setSuggestedSaves] = useState<SaveSuggestion[]>()
  const [error, setError] = useState(false)
  const displayError = useDisplayError()

  const handleError = useCallback(
    (title: string, messages: string | string[]) => {
      setError(true)
      displayError(title, messages)
    },
    [displayError]
  )

  const loadSaveData = useCallback(
    async (savePath: PathData) =>
      backend
        .loadSaveFile(savePath)
        .then(
          R.flatMap((response) =>
            buildUnknownSaveFile(savePath, response.fileBytes, getEnabledSaveTypes())
          )
        ),
    [backend, getEnabledSaveTypes]
  )

  useEffect(() => {
    if (error || suggestedSaves) return
    backend.findSuggestedSaves().then(
      R.match(
        async (possibleSaves) => {
          const allPaths = (possibleSaves.citra ?? [])
            .concat(possibleSaves.open_emu ?? [])
            .concat(possibleSaves.desmume ?? [])

          if (allPaths.length > 0) {
            const saveSuggestions: SaveSuggestion[] = allPaths.map((filePath) => {
              return { loadingSave: loadSaveData(filePath), filePath }
            })

            setSuggestedSaves(saveSuggestions)
          }
        },
        async (err) => handleError('Error getting suggested saves', err)
      )
    )
  }, [backend, error, handleError, loadSaveData, suggestedSaves])

  const columns: SortableColumn<SaveSuggestion>[] = [
    // {
    //   key: 'open',
    //   name: 'Open',
    //   width: '5rem',

    //   renderCell: (params) => (
    //     <button
    //       className="save-grid-button"
    //       onClick={(e) => {
    //         e.preventDefault()
    //         onOpen(params.row.filePath)
    //       }}
    //       disabled={params.row.filePath.raw in openSavePaths}
    //       title={params.row.filePath.raw in openSavePaths ? 'Save is already open' : undefined}
    //     >
    //       Open
    //     </button>
    //   ),
    //   cellClass: 'centered-cell',
    // },
    // {
    //   key: 'game',
    //   name: 'Game',
    //   width: '8rem',
    //   renderValue: (value) => (
    //     <div className="flex-row-centered">
    //       <GameIndicator
    //         originGame={value.game}
    //         plugin={value.pluginIdentifier}
    //         withName
    //         tooltip={value.filePath.raw}
    //       />
    //     </div>
    //   ),
    //   sortFunction: numericSorter((val) => val.game ?? undefined),
    //   cellClass: 'centered-cell',
    // },
    // {
    //   key: 'trainerDetails',
    //   name: 'Trainer',
    //   width: '10rem',
    //   renderValue: (params) => `${params.trainerName} (${params.tid})`,
    //   sortFunction: stringSorter((save) => `${save.trainerName} (${save.tid})`),
    // },
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
    <SortableDataGrid rows={suggestedSaves ?? []} columns={columns} />
  ) : (
    <Flex wrap="wrap" direction="row" justify="center" m="4" gap="2">
      {suggestedSaves?.map((saveSuggestions) => (
        <SaveSuggestionCard
          key={saveSuggestions.filePath.raw}
          saveSuggestion={saveSuggestions}
          onOpen={() => onOpen(saveSuggestions.filePath)}
          size={cardSize}
        />
      ))}
    </Flex>
  )
}
