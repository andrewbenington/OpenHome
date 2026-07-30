import { InfoGridData } from '@openhome-ui/components/InfoGrid'
import { ErrorContext } from '@openhome-ui/state/error'
import { useCallback, useContext } from 'react'

export default function useDisplayError() {
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
