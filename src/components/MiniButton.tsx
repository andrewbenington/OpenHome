import { useMemo } from 'react'
import { IconType } from 'react-icons'
import { MdDataArray } from 'react-icons/md'

export type MiniButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType
  label?: string
}

export default function MiniButton(props: MiniButtonProps) {
  const { icon, style, label, ...buttonProps } = props

  const Icon = useMemo(() => icon ?? MdDataArray, [icon])

  return (
    <button
      style={{
        padding: 0,
        minWidth: 0,
        minHeight: 0,
        width: 'fit-content',
        marginTop: 'auto',
        marginBottom: 'auto',
        borderWidth: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...style,
      }}
      {...buttonProps}
    >
      <Icon fontSize="large" />
      {label && <div style={{ margin: '0px 4px' }}>{label}</div>}
    </button>
  )
}
