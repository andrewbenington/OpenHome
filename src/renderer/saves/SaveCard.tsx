import { Button, Card, Chip, Dropdown, Menu, MenuButton, MenuItem, Stack } from '@mui/joy'
import { isGameBoy } from 'pokemon-resources'
import { useContext, useEffect, useMemo, useState } from 'react'
import { SaveRef } from 'src/types/types'
import { getGameColor } from '../../types/SAVTypes/util'
import { BackendContext } from '../backend/backendProvider'
import { MenuIcon } from '../components/Icons'
import { AppInfoContext } from '../state/appInfo'
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
  const backend = useContext(BackendContext)
  const [appInfo] = useContext(AppInfoContext)
  const [platform, setPlatform] = useState('')

  const gbBackground = useMemo(() => (save.game ? isGameBoy(save.game) : false), [save.game])

  const backgroundColor = useMemo(() => {
    const origin = save.game
    if (origin === undefined) return '#666666'
    if (save.pluginIdentifier) return '#666666'

    const saveType = appInfo.settings.allSaveTypes.find((s) => s.includesOrigin(origin))
    return getGameColor(saveType, origin)
  }, [appInfo.settings, save])

  useEffect(() => {
    backend.getPlatform().then(setPlatform)
  }, [backend])

  return (
    <Card
      className="save-card"
      sx={{
        width: size,
        height: size,
        backgroundImage: `url(${getSaveLogo(save.game)})`,
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
      }}
      color="neutral"
      variant="plain"
      onClick={onOpen}
    >
      <Stack direction="row" margin={1} width="calc(100% - 16px)" justifyContent="start">
        {size >= standardViewMinSize && (
          <Chip color="secondary" variant="solid" sx={{ zIndex: 1 }}>
            <b>{save.trainerName}</b>
          </Chip>
        )}
        {size >= expandedViewMinSize && (
          <Chip variant="soft" color="neutral" sx={{ zIndex: 1 }}>
            <b>{formatTimeSince(save.lastOpened)}</b>
          </Chip>
        )}
        <div style={{ flex: 1 }} />
        <Dropdown>
          <MenuButton
            className="details-button"
            sx={{
              padding: 0,
              height: 28,
              minHeight: 0,
              backgroundColor,
              filter: 'brightness(1.2)',
              ':hover': { backgroundColor, border: '0.5px solid white' },
              '& svg': { color: '#ffffff' },
              zIndex: 1,
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            variant="soft"
          >
            <MenuIcon />
          </MenuButton>
          <Menu style={{ zIndex: 3000 }} placement="bottom-end">
            {onRemove && (
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                Remove
              </MenuItem>
            )}
            <MenuItem
              onClick={(e) => {
                e.stopPropagation()
                backend.openDirectory(save.filePath.dir)
              }}
            >
              Reveal in {platform === 'macos' ? 'Finder' : 'File Explorer'}
            </MenuItem>
          </Menu>
        </Dropdown>
      </Stack>
      <div style={{ flex: 1 }} />
      {size >= expandedViewMinSize ? (
        <Button
          sx={{
            overflowWrap: 'anywhere',
            width: 'calc(100% - 16px)',
            fontSize: 12,
            maxHeight: expanded ? size / 2 : size / 5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 1,
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
  )
}
