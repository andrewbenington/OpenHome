import { getSaveRef, SAV } from '@openhome-core/save/interfaces'
import { R } from '@openhome-core/util/functional'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Spinner } from '@radix-ui/themes'
import { useState } from 'react'
import SaveCard from './SaveCard'
import './style.css'
import { isLoaded, LoadingSaveSuggestion, SaveSuggestion } from './suggestions'

export type SaveSuggestionCardProps = {
  suggestion: SaveSuggestion | LoadingSaveSuggestion
  size?: number
  onOpen: () => void
  onRemove?: () => void
}

const EXPANDED_VIEW_MIN_SIZE = 240

export default function SaveSuggestionCard(props: SaveSuggestionCardProps) {
  const { suggestion, ...saveCardProps } = props
  const [save, setSave] = useState<SAV>()
  const [error, setError] = useState<string>()
  const displayError = useDisplayError()

  if (save) {
    return <SaveCard save={getSaveRef(save)} {...saveCardProps} />
  }

  if (isLoaded(suggestion)) {
    if (R.isOk(suggestion.save)) {
      if (!save) setSave(suggestion.save.value)
      return <SaveCard save={getSaveRef(suggestion.save.value)} {...saveCardProps} />
    }

    if (!error) setError(suggestion.save.err)
  } else {
    suggestion.loadingSave.then(
      R.match(
        (builtSave) => {
          if (!save) setSave(builtSave)
        },
        (err) => {
          if (!error) setError(err)
        }
      )
    )
  }

  const size = saveCardProps.size ?? EXPANDED_VIEW_MIN_SIZE

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="save-card"
        style={{
          width: size,
          height: size,
          backgroundSize: size * 0.9,
          backgroundColor: 'gray',
        }}
      >
        {error ? (
          <div className="suggested-save-grid-error-button-container">
            <button
              className="save-grid-button save-grid-error-button"
              onClick={() => displayError('Invalid Save', error)}
            >
              <ErrorIcon />
            </button>
          </div>
        ) : (
          <Spinner />
        )}
      </div>
    </div>
  )
}
