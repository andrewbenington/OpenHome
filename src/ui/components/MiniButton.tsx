import { IconType } from 'react-icons'
import { MdDataArray } from 'react-icons/md'
import { cssClass } from '../util/style'
import './MiniButton.css'

export type MiniButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType
  imageSrc?: string
  label?: string
  variant?: 'solid' | 'outline'
}

export default function MiniButton(props: MiniButtonProps) {
  const { icon, style, label, imageSrc, ...buttonProps } = props

  const Icon = icon ?? MdDataArray
  const image = imageSrc ? <ImageIcon src={imageSrc} /> : <Icon fontSize="large" />

  return (
    <button
      className={cssClass('mini-button')
        .with('mini-button-icon-only')
        .if(label === undefined)
        .build()}
      style={style}
      {...buttonProps}
    >
      {image}
      {label && <div style={{ margin: '0px 4px' }}>{label}</div>}
    </button>
  )
}

function ImageIcon(props: { src?: string }) {
  return <img src={props.src} />
}
