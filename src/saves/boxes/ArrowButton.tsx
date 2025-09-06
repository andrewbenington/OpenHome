import { Button } from '@radix-ui/themes'
import { CSSProperties, useCallback, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from 'src/components/Icons'
import '../style.css'
import DroppableSpace from './DroppableSpace'

interface OpenHomeButtonProps {
  onClick?: (e?: any) => void
  disabled?: boolean
  style?: CSSProperties
  dragID?: string
  direction: 'left' | 'right'
}
const DRAG_OVER_COOLDOWN_MS = 500

const ArrowButton = (props: OpenHomeButtonProps) => {
  const { onClick, disabled, style, dragID, direction } = props
  const [firstHover, setFirstHover] = useState(true)
  const [hoverCooldown, setHoverCooldown] = useState(false)

  const onDragOver = useCallback(() => {
    if (firstHover) {
      setFirstHover(false)
      setHoverCooldown(true)
      setTimeout(() => {
        setHoverCooldown(false)
      }, DRAG_OVER_COOLDOWN_MS)
      return
    }

    if (hoverCooldown || !onClick) {
      return
    }
    setHoverCooldown(true)
    onClick()

    setTimeout(() => {
      setHoverCooldown(false)
    }, DRAG_OVER_COOLDOWN_MS)
  }, [hoverCooldown, onClick, firstHover])

  const onNotDragOver = useCallback(() => {
    setFirstHover(true)
  }, [])

  return (
    <Button
      className="arrow-button"
      onClick={onClick}
      variant="soft"
      style={style}
      disabled={disabled}
    >
      <DroppableSpace dropID={`${dragID}-drop`} onOver={onDragOver} onNotOver={onNotDragOver}>
        {direction === 'left' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      </DroppableSpace>
    </Button>
  )
}

export default ArrowButton
