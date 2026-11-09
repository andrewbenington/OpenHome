import { InfoGridData } from '@openhome-ui/components/InfoGrid'
import { ErrorContext } from '@openhome-ui/state/error'
import { useCallback, useContext } from 'react'

export type ErrorDisplayFn = (title: string, messages: string | string[], data?: any) => void

export function useDisplayError(): ErrorDisplayFn {
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

export type TitledErrorFnBuilder = (errorTitle: string) => (error: unknown) => void

export function useTitledErrorDisplay(): TitledErrorFnBuilder {
  const [, dispatchErrorState] = useContext(ErrorContext)

  const displayTitledError = (errorTitle: string) => (error: unknown) =>
    dispatchErrorState({
      type: 'set_message',
      payload: {
        title: errorTitle,
        messages: [String(error)],
      },
    })

  return displayTitledError
}
