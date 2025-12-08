import { Generation, getPluginColor, OriginGames } from '@pkm-rs/pkg'
import { Badge, Flex } from '@radix-ui/themes'
import { useContext, useMemo, useState } from 'react'
import { SaveRef } from 'src/types/types'
import { BackendContext } from '../backend/backendContext'
import OpenHomeCtxMenu from '../components/context-menu/OpenHomeCtxMenu'
import { ErrorIcon } from '../components/Icons'
import useDisplayError from '../hooks/displayError'
import './style.css'
import { buildRecentSaveContextElements, formatTimeSince, logoFromSaveRef } from './util'

export type SaveCardProps = {
  save: SaveRef
  size?: number
  onOpen: () => void
  onRemove: () => void
}

const expandedViewMinSize = 240

const standardViewMinSize = 180

export default function SaveCard({ save, onOpen, onRemove, size = 240 }: SaveCardProps) {
  const [expanded, setExpanded] = useState(false)
  const displayError = useDisplayError()
  const backend = useContext(BackendContext)

  const isGameBoy = useMemo(() => {
    return save.game
      ? OriginGames.generation(save.game) === Generation.G1 ||
          OriginGames.generation(save.game) === Generation.G2
      : false
  }, [save.game])

  const backgroundColor = useMemo(() => {
    return save.pluginIdentifier
      ? getPluginColor(save.pluginIdentifier)
      : OriginGames.color(save.game ?? 0)
  }, [save.game, save.pluginIdentifier])

  const saveLogoPath = logoFromSaveRef(save)
  const backgroundImage = saveLogoPath ? `url(${saveLogoPath})` : undefined

  return (
    <OpenHomeCtxMenu elements={buildRecentSaveContextElements(save, backend, onRemove)}>
      <div style={{ position: 'relative' }}>
        <div
          className="save-card"
          style={{
            width: size,
            height: size,
            backgroundImage,
            backgroundSize: isGameBoy ? size : size * 0.9,
            backgroundColor,
            filter: save.valid ? undefined : 'grayscale(1)',
          }}
          onClick={onOpen}
        >
          <Flex direction="row" width="100%" justify="start" style={{ padding: 8 }} gap="2">
            {size >= standardViewMinSize && (
              <Badge variant="solid" size="3">
                <b>{save.trainerName}</b>
              </Badge>
            )}
            {save.lastOpened && size >= expandedViewMinSize && (
              <Badge
                variant="solid"
                size="3"
                color="gray"
                radius="full"
                style={{ maxWidth: '56%' }}
              >
                <b>{formatTimeSince(save.lastOpened)}</b>
              </Badge>
            )}
          </Flex>
          <div style={{ flex: 1 }} />
          {size >= expandedViewMinSize && save.valid ? (
            <button
              className="save-file-path"
              style={{ maxHeight: expanded ? size / 2 : size / 5 }}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              <div>{save.filePath.raw}</div>
            </button>
          ) : size < standardViewMinSize ? (
            <Badge variant="solid" size="3" m="1" style={{ width: 'fit-content' }}>
              <b>{save.trainerName}</b>
            </Badge>
          ) : (
            <div />
          )}
        </div>
        {!save.valid && (
          <div className="save-grid-error-button-container">
            <button
              className="save-grid-error-button"
              onClick={() =>
                displayError('Invalid Save', 'File is missing, renamed, or inaccessbile')
              }
            >
              <ErrorIcon style={{ width: 20 }} />
            </button>
          </div>
        )}
      </div>
    </OpenHomeCtxMenu>
  )
}
