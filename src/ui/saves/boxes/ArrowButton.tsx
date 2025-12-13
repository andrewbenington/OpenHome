import { Button } from '@radix-ui/themes'
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from 'src/ui/components/Icons'
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
  const [timer, setTimer] = useState<NodeJS.Timeout>()
  const onClickRef = useRef(onClick)

  useEffect(() => {
    onClickRef.current = onClick
  }, [onClick])

  const onDragOver = useCallback(() => {
    if (timer) {
      clearInterval(timer)
    }

    const newTimer = setInterval(() => {
      onClickRef.current?.()
    }, DRAG_OVER_COOLDOWN_MS)

    setTimer(newTimer)
  }, [timer])

  const onNotDragOver = useCallback(() => {
    if (timer) {
      clearInterval(timer)
    }
  }, [timer])

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
