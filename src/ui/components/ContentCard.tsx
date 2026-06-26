import { PropsWithChildren } from 'react'
import './ContentCard.css'

export default function ContentCard(props: PropsWithChildren & { className?: string }) {
  const { children, ...outerProps } = props
  return (
    <div className="content-card-outer" {...outerProps}>
      <div className="content-card-inner">{children}</div>
    </div>
  )
}
