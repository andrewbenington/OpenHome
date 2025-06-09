import { DropdownMenu, IconButton } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import { MenuIcon } from 'src/components/Icons'
import useIsDarkMode from 'src/hooks/dark-mode'
import { SaveRef } from 'src/types/types'
import { colorIsDark } from '../util/color'

export type SaveDetailsMenuProps = {
  save: SaveRef
  backgroundColor?: string
  backgroundAlwaysPresent?: boolean
  onRemove?: () => void
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
