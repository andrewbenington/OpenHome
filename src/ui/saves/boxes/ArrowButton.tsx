import { ArrowLeftIcon, ArrowRightIcon } from '@openhome-ui/components/Icons'
import { Button, ButtonProps } from '@radix-ui/themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { classNames } from 'src/ui/util/style'
import '../style.css'
import DroppableSpace from './DroppableSpace'

interface ArrowButtonProps extends ButtonProps {
  onClick?: (e?: any) => void
  dragID?: string
  direction: 'left' | 'right'
}

const DRAG_OVER_COOLDOWN_MS = 500

const ArrowButton = (props: ArrowButtonProps) => {
  const { className, onClick, disabled, style, dragID, direction } = props
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
      className={classNames('arrow-button', className)}
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
