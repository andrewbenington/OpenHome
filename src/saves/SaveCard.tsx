import { Generation, getPluginColor, OriginGames } from '@pokemon-resources/pkg'
import { Badge, Flex } from '@radix-ui/themes'
import { useMemo, useState } from 'react'
import { SaveRef } from 'src/types/types'
import { ErrorIcon } from '../components/Icons'
import useDisplayError from '../hooks/displayError'
import SaveDetailsMenu from './SaveDetailsMenu'
import './style.css'
import { formatTimeSince, logoFromSaveRef } from './util'

export type SaveCardProps = {
  save: SaveRef
  size?: number
  onOpen: () => void
  onRemove?: () => void
}

const expandedViewMinSize = 240

const standardViewMinSize = 180

export default function SaveCard({ save, onOpen, onRemove, size = 240 }: SaveCardProps) {
  const [expanded, setExpanded] = useState(false)
  const displayError = useDisplayError()

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
    <div style={{ position: 'relative' }}>
      <div
        className="save-card"
        style={{
          width: size,
          height: size,
          backgroundImage,
          backgroundSize: isGameBoy ? size : size * 0.9,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundColor,
          display: 'flex',
          flexDirection: 'column',
          transition: 'background-color 0.2s',
          padding: 0,
          cursor: 'pointer',
          position: 'relative',
          filter: save.valid ? undefined : 'grayscale(1)',
          borderRadius: 5,
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
            <Badge variant="solid" size="3" color="gray" radius="full" style={{ maxWidth: '56%' }}>
              <b>{formatTimeSince(save.lastOpened)}</b>
            </Badge>
          )}
          <div style={{ flex: 1, marginLeft: -16 }} />
          <SaveDetailsMenu
            save={save}
            backgroundColor={backgroundColor}
            onRemove={onRemove}
            backgroundAlwaysPresent={isGameBoy}
          />
        </Flex>
        <div style={{ flex: 1 }} />
        {size >= expandedViewMinSize && save.valid ? (
          <button
            style={{
              overflowWrap: 'anywhere',
              width: 'calc(100% - 12px)',
              fontSize: 12,
              maxHeight: expanded ? size / 2 : size / 5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: '6px',
              lineHeight: 1.2,
              transition: 'max-height 0.3s',
              cursor: 'pointer',
              textAlign: 'start',
              display: 'flex',
              flexDirection: 'column-reverse',
              padding: '0px 3px 3px',
              zIndex: 1,
            }}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                width: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
              }}
            >
              {save.filePath.raw}
            </div>
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
        <div
          style={{
            width: '100%',
            position: 'absolute',
            bottom: 8,
            display: 'grid',
            justifyContent: 'center',
          }}
        >
          <button
            className="save-grid-error-button"
            onClick={() =>
              displayError('Invalid Save', 'File is missing, renamed, or inaccessbile')
            }
            style={{
              filter: 'none',
              alignSelf: 'center',
            }}
          >
            <ErrorIcon style={{ width: 20 }} />
          </button>
        </div>
      )}
    </div>
  )
}
