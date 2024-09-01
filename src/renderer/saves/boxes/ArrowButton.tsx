import { useState } from 'react'
import './style.css'

interface OpenHomeButtonProps {
  onClick?: (e?: any) => void
  style?: any
  children?: any
}

const ArrowButton = (props: OpenHomeButtonProps) => {
  const { onClick, children } = props
  const [timer, setTimer] = useState<NodeJS.Timeout>()
  return (
    <button
      className="arrow-button"
      onClick={onClick}
      onDragEnter={() => {
        clearTimeout(timer)
        setTimer(
          setTimeout(() => {
            onClick && onClick()
            setTimer(undefined)
          }, 500)
        )
      }}
      onDragLeave={() => {
        clearTimeout(timer)
        setTimer(undefined)
      }}
      style={{ backgroundColor: timer ? 'grey' : undefined }}
    >
      {children}
    </button>
  )
}

export default ArrowButton
