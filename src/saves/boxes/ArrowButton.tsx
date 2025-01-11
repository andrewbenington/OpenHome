import { Button } from '@radix-ui/themes'
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
    <Button className="arrow-button" onClick={onClick} variant="soft">
      <DroppableSpace dropID={`${dragID}-drop`} onOver={onDragOver}>
        {direction === 'left' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      </DroppableSpace>
    </Button>
  )
}

export default ArrowButton
