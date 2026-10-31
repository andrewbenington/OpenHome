import OhoFlex from '@openhome-ui/components/OhoFlex'
import { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import './TitledCard.css'

export type TitledCardProps = PropsWithChildren & {
  side: 'left' | 'right'
  title: ReactNode
  topControls?: ReactNode
  style?: CSSProperties
}

export function TitledCard(props: TitledCardProps) {
  const { side, title, ...innerProps } = props

  const titleElement = <div className="titled-card-title">{title}</div>
  const topControls = <div className="titled-card-top-controls">{props.topControls}</div>

  return (
    <div className="titled-card flat-bottom dark-scrollbar" {...innerProps}>
      <div className={`titled-card-top-bar titled-card-title-${side}`}>
        {side === 'left' ? (
          <OhoFlex.Row>
            {titleElement}
            <OhoFlex.Spacer />
            {topControls}
          </OhoFlex.Row>
        ) : (
          <OhoFlex.Row>
            {topControls}
            <OhoFlex.Spacer />
            {titleElement}
          </OhoFlex.Row>
        )}
      </div>
      <div className="titled-card-content scroller-wrapper" {...innerProps} />
    </div>
  )
}
