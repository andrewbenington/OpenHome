import { Button, Card, Chip, Dropdown, Menu, MenuButton, MenuItem, Stack } from '@mui/joy'
import { useContext, useEffect, useState } from 'react'
import { GameColors } from 'src/types/SAVTypes/util'
import { SaveRef } from 'src/types/types'
import { BackendContext } from '../backend/backendProvider'
import { MenuIcon } from '../components/Icons'
import { formatTimeSince, getSaveLogo } from './util'

export type SaveCardProps = {
  save: SaveRef
  onOpen: () => void
  onRemove?: () => void
}

export default function SaveCard({ save, onOpen, onRemove }: SaveCardProps) {
  const [expanded, setExpanded] = useState(false)
  const backend = useContext(BackendContext)
  const [platform, setPlatform] = useState('')
  const size = 240

  useEffect(() => {
    backend.getPlatform().then(setPlatform)
  }, [backend])

  return (
    <Card
      sx={{
        width: size,
        height: size,
        backgroundImage: `url(${getSaveLogo(save.game)})`,
        backgroundSize: size * 0.8,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundColor: save.game ? GameColors[save.game] : undefined,
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
        <Chip color="secondary" variant="solid">
          <b>{save.trainerName}</b>
        </Chip>
        <Chip variant="soft" color="neutral">
          <b>{formatTimeSince(save.lastOpened)}</b>
        </Chip>
        <div style={{ flex: 1 }} />
        <Dropdown>
          <MenuButton
            sx={{ padding: 0, height: 28, minHeight: 0 }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MenuIcon />
          </MenuButton>
          <Menu style={{ zIndex: 3000 }} size="sm">
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
      <Button
        sx={{
          overflowWrap: 'break-word',
          width: 'calc(100% - 16px)',
          fontSize: 12,
          maxHeight: expanded ? size / 2 : 40,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          margin: 1,
          lineHeight: 1.2,
          transition: 'max-height 0.3s',
          cursor: 'pointer',
          textAlign: 'start',
          verticalAlign: 'end',
          display: 'block',
          padding: 0.45,
        }}
        variant="solid"
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
      >
        {save.filePath.raw}
      </Button>
    </Card>
  )
}
