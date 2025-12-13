import { useCallback, useContext } from 'react'
import { ErrorContext } from 'src/state/error'

export default function useDisplayError() {
  const [, dispatchErrorState] = useContext(ErrorContext)

  const displayError = useCallback(
    (title: string, messages: string | string[]) =>
      dispatchErrorState({
        type: 'set_message',
        payload: {
          title,
          messages: typeof messages === 'string' ? [messages] : messages,
        },
      }),
    [dispatchErrorState]
  )

  return displayError
}
