import { useMemo } from 'react'
import { IconType } from 'react-icons'
import { MdDataArray } from 'react-icons/md'

export type MiniButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType
  label?: string
  variant?: 'solid' | 'outline'
}

export default function MiniButton(props: MiniButtonProps) {
  const { icon, style, label, variant, ...buttonProps } = props

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
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: variant === 'outline' ? 'transparent' : undefined,
        border: variant === 'outline' ? '1px solid currentColor' : '1px solid transparent',
        ...style,
      }}
      {...buttonProps}
    >
      <Icon fontSize="large" />
      {label && <div style={{ margin: '0px 4px' }}>{label}</div>}
    </button>
  )
}
