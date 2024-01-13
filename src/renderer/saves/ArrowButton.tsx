import React from 'react'
import './style.css'

interface OpenHomeButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  style?: any
  children?: any
}

const ArrowButton = (props: OpenHomeButtonProps) => {
  const { onClick, children } = props
  return (
    <button className="arrow-button" onClick={onClick}>
      {children}
    </button>
  )
}

export default ArrowButton
