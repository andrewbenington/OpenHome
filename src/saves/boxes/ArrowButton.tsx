import { useCallback, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from 'src/components/Icons'
import '../style.css'
import { DroppableSpace } from './BoxCell'

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
      console.log('cooldown active; ignoring')
      return
    }
    setHoverCooldown(true)
    onClick()

    setTimeout(() => {
      console.log('ending cooldown')
      setHoverCooldown(false)
    }, DRAG_OVER_COOLDOWN_MS)
  }, [hoverCooldown, onClick])

  return (
    <button
      className="arrow-button"
      onClick={onClick}
      style={{ backgroundColor: 'grey', padding: 0, width: 24, height: 20 }}
    >
      <DroppableSpace dropID={`${dragID}-drop`} onOver={onDragOver}>
        {direction === 'left' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
      </DroppableSpace>
    </button>
  )
}

export default ArrowButton
