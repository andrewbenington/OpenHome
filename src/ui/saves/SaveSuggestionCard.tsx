import { getSaveRef, SAV } from '@openhome-core/save/interfaces'
import { PathData } from '@openhome-core/save/util/path'
import { Errorable, R } from '@openhome-core/util/functional'
import OpenHomeCtxMenu from '@openhome-ui/components/context-menu/OpenHomeCtxMenu'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { Spinner } from '@radix-ui/themes'
import { useState } from 'react'
import SaveCard from './SaveCard'
import './style.css'

export type SaveSuggestion = {
  loadingSave: Promise<Errorable<SAV>>
  filePath: PathData
}

export type SaveSuggestionCardProps = {
  saveSuggestion: SaveSuggestion
  size?: number
  onOpen: () => void
  onRemove?: () => void
}

const EXPANDED_VIEW_MIN_SIZE = 240

export default function SaveSuggestionCard(props: SaveSuggestionCardProps) {
  const { saveSuggestion, ...saveCardProps } = props
  const [save, setSave] = useState<SAV>()
  const [error, setError] = useState<string>()
  const displayError = useDisplayError()

  saveSuggestion.loadingSave.then(
    R.match(
      (builtSave) => {
        if (!save) {
          setSave(builtSave)
        }
      },
      (err) => setError(err)
    )
  )

  if (save) {
    return <SaveCard save={getSaveRef(save)} {...saveCardProps} />
  }

  const size = saveCardProps.size ?? EXPANDED_VIEW_MIN_SIZE

  return (
    <OpenHomeCtxMenu elements={[]}>
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
          <Spinner />
        </div>
        {error && (
          <div className="save-grid-error-button-container">
            <button
              className="save-grid-button save-grid-error-button"
              onClick={() => displayError('Invalid Save', error)}
            >
              <ErrorIcon />
            </button>
          </div>
        )}
      </div>
    </OpenHomeCtxMenu>
  )
}
