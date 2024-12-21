import { Button, Card, Chip, Stack } from '@mui/joy'
import { GameOfOrigin, isGameBoy } from 'pokemon-resources'
import { useContext, useMemo, useState } from 'react'
import { ErrorContext } from 'src/state/error'
import { SaveRef } from 'src/types/types'
import { ErrorIcon } from '../components/Icons'
import { AppInfoContext } from '../state/appInfo'
import { getGameColor, getPluginIdentifier } from '../types/SAVTypes/util'
import SaveDetailsMenu from './SaveDetailsMenu'
import './style.css'
import { formatTimeSince, getSaveLogo } from './util'

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
  const [, dispatchErrorState] = useContext(ErrorContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

  const gbBackground = useMemo(() => (save.game ? isGameBoy(save.game) : false), [save.game])

  const saveType = useMemo(
    () =>
      save.game
        ? getEnabledSaveTypes().find((s) => {
            if (save.pluginIdentifier || getPluginIdentifier(s)) {
              return save.pluginIdentifier === getPluginIdentifier(s)
            }
            return s.includesOrigin(save.game as GameOfOrigin)
          })
        : undefined,
    [getEnabledSaveTypes, save.game, save.pluginIdentifier]
  )

  const backgroundColor = useMemo(() => {
    return getGameColor(saveType, save.game as GameOfOrigin)
  }, [save.game, saveType])

  return (
    <div style={{ position: 'relative' }}>
      <Card
        className="save-card"
        sx={{
          width: size,
          height: size,
          backgroundImage: saveType
            ? `url(${getSaveLogo(saveType, save.game as GameOfOrigin)})`
            : undefined,
          backgroundSize: gbBackground ? size : size * 0.9,
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
        }}
        color="neutral"
        variant="plain"
        onClick={onOpen}
      >
        <Stack direction="row" padding="6px" width="calc(100% - 12px)" justifyContent="start">
          {size >= standardViewMinSize && (
            <Chip color="secondary" variant="solid" sx={{ zIndex: 1 }}>
              <b>{save.trainerName}</b>
            </Chip>
          )}
          {save.lastOpened && size >= expandedViewMinSize && (
            <Chip variant="soft" color="neutral" sx={{ zIndex: 1 }}>
              <b>{formatTimeSince(save.lastOpened)}</b>
            </Chip>
          )}
          <div style={{ flex: 1 }} />
          <SaveDetailsMenu
            save={save}
            backgroundColor={backgroundColor}
            onRemove={onRemove}
            backgroundAlwaysPresent={save.game ? isGameBoy(save.game) : false}
          />
        </Stack>
        <div style={{ flex: 1 }} />
        {size >= expandedViewMinSize && save.valid ? (
          <Button
            sx={{
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
            variant="solid"
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
          </Button>
        ) : size < standardViewMinSize ? (
          <Chip color="secondary" variant="solid" sx={{ margin: '8px', zIndex: 1 }}>
            <b>{save.trainerName}</b>
          </Chip>
        ) : (
          <div />
        )}
      </Card>
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
              dispatchErrorState({
                type: 'set_message',
                payload: {
                  title: 'Invalid Save',
                  messages: ['File is missing, renamed, or inaccessbile'],
                },
              })
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
