import React from 'react'

interface OpenHomeButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  style?: any
  children?: any
  disabled?: any
}

const OpenHomeButton = (props: OpenHomeButtonProps) => {
  const { onClick, style, children, disabled } = props
  return (
    <button
      style={{
        borderRadius: 3,
        cursor: 'pointer',
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default OpenHomeButton
