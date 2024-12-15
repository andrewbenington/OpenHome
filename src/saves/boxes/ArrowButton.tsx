import { useTheme } from '@mui/joy'
import { useCallback, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from 'src/components/Icons'
import '../style.css'
import DroppableSpace from './DroppableSpace'

interface OpenHomeButtonProps {
  onClick?: (e?: any) => void
  style?: any
  dragID?: string
  direction: 'left' | 'right'
}
const DRAG_OVER_COOLDOWN_MS = 250
const ArrowButton = (props: OpenHomeButtonProps) => {
  const { dragID, onClick, direction } = props
  const [hoverCooldown, setHoverCooldown] = useState(false)
  const { palette } = useTheme()

  const onDragOver = useCallback(() => {
    if (hoverCooldown || !onClick) {
      return
    }
    setHoverCooldown(true)
    onClick()

    setTimeout(() => {
      setHoverCooldown(false)
    }, DRAG_OVER_COOLDOWN_MS)
  }, [hoverCooldown, onClick])

  return (
    <button
      className="arrow-button"
      onClick={onClick}
      style={{
        backgroundColor: palette.primary.solidBg,
        color: palette.neutral.solidColor,
        padding: 0,
        width: 32,
        height: 24,
      }}
    >
      <DroppableSpace dropID={`${dragID}-drop`} onOver={onDragOver}>
        {direction === 'left' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      </DroppableSpace>
    </button>
  )
}

export default ArrowButton
