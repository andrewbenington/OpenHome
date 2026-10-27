import { CSSProperties, PropsWithChildren } from 'react'
import './TitledCard.css'

export type TitledCardProps = PropsWithChildren & {
  side: 'left' | 'right'
  title: string
  style?: CSSProperties
}

export function TitledCard(props: TitledCardProps) {
  const { side, title, ...innerProps } = props
  return (
    <div className="titled-card flat-bottom dark-scrollbar" {...innerProps}>
      <div className={`titled-card-title titled-card-title-${side}`}>
        <h3>{title}</h3>
      </div>
      <div className="titled-card-content scroller-wrapper" {...innerProps} />
    </div>
  )
}
