import { useMemo } from 'react'
import { IconType } from 'react-icons'
import { MdDataArray } from 'react-icons/md'
import { cssClass } from '../util/style'

export type MiniButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType
  label?: string
  variant?: 'solid' | 'outline'
}

export default function MiniButton(props: MiniButtonProps) {
  const { icon, style, label, ...buttonProps } = props

  const Icon = useMemo(() => icon ?? MdDataArray, [icon])

  return (
    <button
      className={cssClass('mini-button')
        .with('mini-button-icon-only')
        .if(label === undefined)
        .build()}
      style={style}
      {...buttonProps}
    >
      <Icon fontSize="large" />
      {label && <div style={{ margin: '0px 4px' }}>{label}</div>}
    </button>
  )
}
