// noinspection JSUnusedLocalSymbols

import { ReactNode } from 'react'

export function OhpkmWrapper(props: {
  description: string
  children: ReactNode
  useStateManager: {
    identifier: 'lookups'
  }
  stateContext: any
}) {
  // TODO Actually make use of props
  // eslint-disable-next-line no-console
  console.log(props)
  return null
}
