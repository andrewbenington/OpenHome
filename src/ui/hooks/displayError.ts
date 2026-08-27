import { InfoGridData } from '@openhome-ui/components/InfoGrid'
import { ErrorContext } from '@openhome-ui/state/error'
import { useCallback, useContext } from 'react'

export type ErrorDisplayFn = (title: string, messages: string | string[], data?: any) => void

export default function useDisplayError(): ErrorDisplayFn {
  const [, dispatchErrorState] = useContext(ErrorContext)

  const displayError = useCallback(
    (title: string, messages: string | string[], data?: InfoGridData) =>
      dispatchErrorState({
        type: 'set_message',
        payload: {
          title,
          messages: typeof messages === 'string' ? [messages] : messages,
          data,
        },
      }),
    [dispatchErrorState]
  )

  return displayError
}
