import { Button, ButtonProps } from '@mui/joy'
import { useMemo } from 'react'
import { IconType } from 'react-icons'
import { MdDataArray } from 'react-icons/md'

export type MiniButtonProps = ButtonProps & {
  icon?: IconType
  label?: string
}

export default function MiniButton(props: MiniButtonProps) {
  const { icon, style, label, ...buttonProps } = props

  const Icon = useMemo(() => icon ?? MdDataArray, [icon])

  return (
    <Button
      style={{
        padding: 2,
        minWidth: 0,
        minHeight: 0,
        // height: 'fit-content',
        marginTop: 'auto',
        marginBottom: 'auto',
        borderWidth: 1,
        ...style,
      }}
      variant="outlined"
      {...buttonProps}
    >
      <Icon fontSize="large" />
      {label && <div style={{ margin: '0px 4px' }}>{label}</div>}
    </Button>
  )
}
