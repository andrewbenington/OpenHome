import useIsDebug from '@openhome-ui/hooks/isDebug'
import { ReactNode } from 'react'

export type DebugOnlyProps = {
  children?: ReactNode
}

export default function DebugOnly(props: DebugOnlyProps) {
  return useIsDebug() ? props.children : undefined
}
