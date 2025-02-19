import { DropdownMenu, IconButton } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
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
        ? '#000'
        : darkBackground
          ? '#0003'
          : '#fff6'
  }, [backgroundAlwaysPresent, backgroundColor, darkBackground, isDarkMode, save.valid])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()}>
        <IconButton
          className={`details-button ${backgroundAlwaysPresent ? 'details-button-img-background' : ''}`}
          variant="ghost"
          color="gray"
          style={{
            color: darkBackground ? '#fff' : '#333',
            // @ts-ignore (css var workaround)
            '--hover-bg': hoverBg,
          }}
        >
          <MenuIcon />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content style={{ padding: 0 }} variant="soft">
        {onRemove && (
          <DropdownMenu.Item
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            Remove
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Item
          onClick={(e) => {
            e.stopPropagation()
            backend.openDirectory(save.filePath.dir)
          }}
        >
          Reveal in {backend.getPlatform() === 'macos' ? 'Finder' : 'File Explorer'}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
