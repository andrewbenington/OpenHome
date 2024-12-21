import { Dropdown, Menu, MenuButton, MenuItem } from '@mui/joy'
import { useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { MenuIcon } from 'src/components/Icons'
import useIsDarkMode from 'src/hooks/dark-mode'
import { SaveRef } from 'src/types/types'

export type SaveDetailsMenuProps = {
  save: SaveRef
  backgroundColor?: string
  backgroundAlwaysPresent?: boolean
  onRemove?: () => void
}

function colorIsDark(bgColor?: string) {
  if (!bgColor) return false
  const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor

  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)

  const uicolors = [r / 255, g / 255, b / 255]
  const c = uicolors.map((color) => {
    if (color <= 0.03928) {
      return color / 12.92
    }
    return Math.pow((color + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

  return L <= 0.179
}

export default function SaveDetailsMenu(props: SaveDetailsMenuProps) {
  const { save, backgroundColor, backgroundAlwaysPresent, onRemove } = props
  const backend = useContext(BackendContext)
  const isDarkMode = useIsDarkMode()
  const [platform, setPlatform] = useState('')

  useEffect(() => {
    backend.getPlatform().then(setPlatform)
  }, [backend])

  const darkBackground = useMemo(() => {
    if (!backgroundColor) {
      return isDarkMode
    }
    return backgroundColor && backgroundAlwaysPresent ? true : colorIsDark(backgroundColor)
  }, [backgroundColor, backgroundAlwaysPresent, isDarkMode])

  const hoverBg = useMemo(() => {
    if (!backgroundColor) {
      return isDarkMode ? '#fff3' : '#0003'
    }
    return !save.valid
      ? '#fff6'
      : backgroundAlwaysPresent
        ? '#000b'
        : darkBackground
          ? '#0003'
          : '#fff6'
  }, [backgroundAlwaysPresent, backgroundColor, darkBackground, isDarkMode, save.valid])

  return (
    <Dropdown>
      <MenuButton
        className="details-button"
        sx={{
          color: darkBackground ? '#fff' : '#333',
          backgroundColor: backgroundAlwaysPresent ? '#0007' : 'transparent',
          ':hover': {
            backgroundColor: hoverBg,
          },
          '& svg': {
            color: darkBackground ? '#fff' : '#000',
          },
        }}
        onClick={(e) => e.stopPropagation()}
        color="secondary"
        variant="solid"
      >
        <MenuIcon />
      </MenuButton>
      <Menu style={{ zIndex: 1301 }} placement="bottom-end">
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
  )
}
