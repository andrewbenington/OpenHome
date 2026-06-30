import { buildUnknownSaveFile } from '@openhome-core/save/util/load'
import { PathData, splitPath } from '@openhome-core/save/util/path'
import { R } from '@openhome-core/util/functional'
import { numericSorter, SortableColumn, stringSorter } from '@openhome-core/util/sort'
import useBackend from '@openhome-ui/backend/useBackend'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import { GameIndicator } from '@openhome-ui/components/pokemon/indicator/GameIndicator'
import SortableDataGrid from '@openhome-ui/components/SortableDataGrid'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useSaves } from '@openhome-ui/state/saves'
import { Flex, Spinner } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useState } from 'react'
import SaveSuggestionCard from './SaveSuggestionCard'
import { isLoaded, LoadingSaveSuggestion, SaveSuggestion } from './suggestions'
import { SaveViewMode } from './util'

interface SaveFileSelectorProps {
  onOpen: (path: PathData) => void
  view: SaveViewMode
  cardSize: number
}

export default function SuggestedSaves(props: SaveFileSelectorProps) {
  const { onOpen, view, cardSize } = props
  const backend = useBackend()
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const [suggestions, setSuggestions] = useState<(SaveSuggestion | LoadingSaveSuggestion)[]>()
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
    if (error || suggestions) return
    backend.findSuggestedSaves().then(
      R.match(
        async (possibleSaves) => {
          const allPaths = (possibleSaves.citra ?? [])
            .concat(possibleSaves.open_emu ?? [])
            .concat(possibleSaves.desmume ?? [])

          if (allPaths.length > 0) {
            const saveSuggestions: LoadingSaveSuggestion[] = allPaths.map((filePath) => {
              return { loadingSave: loadSaveData(filePath), filePath }
            })

            setSuggestions(saveSuggestions)
          }
        },
        async (err) => handleError('Error getting suggested saves', err)
      )
    )
  }, [backend, error, handleError, loadSaveData, suggestions])

  suggestions?.forEach((suggestion, i) => {
    if (!isLoaded(suggestion)) {
      suggestion.loadingSave.then((loaded) => {
        suggestions[i] = {
          save: loaded,
          filePath: suggestions[i].filePath,
        }
        setSuggestions([...suggestions])
      })
    }
  })

  const openSavePaths = new Set(useSaves().allOpenSaves.map((save) => save.filePath.raw))

  const columns: SortableColumn<SaveSuggestion | LoadingSaveSuggestion>[] = [
    {
      key: 'open',
      name: 'Open',
      width: '5rem',

      renderValue: (suggestion) => {
        if (!isLoaded(suggestion)) return <Spinner />

        const save = suggestion.save
        if (R.isErr(save)) {
          return (
            <button
              className="save-grid-button save-grid-error-button"
              onClick={() => displayError('Invalid Save', save.err)}
            >
              <ErrorIcon />
            </button>
          )
        }

        return (
          <button
            className="save-grid-button"
            onClick={(e) => {
              e.preventDefault()
              onOpen(suggestion.filePath)
            }}
            disabled={openSavePaths.has(suggestion.filePath.raw)}
            title={openSavePaths.has(suggestion.filePath.raw) ? 'Save is already open' : undefined}
          >
            Open
          </button>
        )
      },
      cellClass: 'centered-cell',
    },
    {
      key: 'game',
      name: 'Game',
      width: '8rem',
      renderValue: (suggestion) => (
        <div className="flex-row-centered">
          {isLoaded(suggestion) ? (
            R.isOk(suggestion.save) ? (
              <GameIndicator
                originGame={suggestion.save.value.origin}
                plugin={suggestion.save.value.pluginIdentifier}
                withName
                tooltip={suggestion.filePath.raw}
              />
            ) : null
          ) : (
            <Spinner />
          )}
        </div>
      ),
      sortFunction: numericSorter((suggestion) =>
        isLoaded(suggestion) && R.isOk(suggestion.save) ? suggestion.save.value.origin : undefined
      ),
      cellClass: 'centered-cell',
    },
    {
      key: 'trainerDetails',
      name: 'Trainer',
      width: '10rem',
      renderValue: (suggestion) =>
        isLoaded(suggestion) ? (
          R.isOk(suggestion.save) ? (
            `${suggestion.save.value.name} (${suggestion.save.value.tid})`
          ) : null
        ) : (
          <Spinner />
        ),
      sortFunction: stringSorter((suggestion) =>
        isLoaded(suggestion) && R.isOk(suggestion.save)
          ? `${suggestion.save.value.name} (${suggestion.save.value.tid})`
          : null
      ),
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
    <SortableDataGrid
      rows={suggestions ?? []}
      columns={columns}
      key={suggestions?.map((suggestion) => isLoaded(suggestion)).join(',')}
    />
  ) : (
    <Flex wrap="wrap" direction="row" justify="center" m="4" gap="2">
      {suggestions?.map((suggestion) => (
        <SaveSuggestionCard
          key={suggestion.filePath.raw}
          suggestion={suggestion}
          onOpen={() => onOpen(suggestion.filePath)}
          size={cardSize}
        />
      ))}
    </Flex>
  )
}
