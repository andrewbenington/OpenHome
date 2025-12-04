import { Flex } from '@radix-ui/themes'
import { ReactNode, useMemo, useState } from 'react'
import { ExpandArrowIcon } from 'src/components/Icons'
import AttributeRow from './AttributeRow'
import './style.css'

export default function AttributeRowExpand(props: {
  summary: string
  value?: string | ReactNode
  justifyEnd?: boolean
  indent?: number
  children?: ReactNode
  style?: any
}) {
  const { summary: label, value, children } = props
  const [expanded, setExpanded] = useState(false)

  const length = useMemo(
    () =>
      children && typeof children === 'object' && 'length' in children
        ? (children.length as number)
        : 1,
    [children]
  )

  return (
    <details
      className="expandable-attribute-row"
      style={{ maxHeight: expanded ? (length + 1) * 34 : 32 }}
      open={expanded}
      onToggle={(e) => setExpanded((e.nativeEvent as ToggleEvent).newState === 'open')}
    >
      <summary>
        <div style={{ position: 'relative', width: '100%' }}>
          <AttributeRow label={label}>{value}</AttributeRow>
          <ExpandArrowIcon
            className="expandable-attribute-row-arrow"
            style={{ rotate: expanded ? '90deg' : '0deg' }}
          />
        </div>
      </summary>
      <Flex direction="column" gap="2px" mt="2px">
        {children}
      </Flex>
    </details>
  )
}
