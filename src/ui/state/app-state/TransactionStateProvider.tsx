import { ErrorIcon } from '@openhome-ui/components/Icons'
import LoadingIndicator from '@openhome-ui/components/LoadingIndicator'
import { Callout, Flex } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { TransactionStateContext, usePossiblyLoadedTxState } from './transactionState'

type TransactionStateProviderProps = {
  children: ReactNode
}

export default function TransactionStateProvider({ children }: TransactionStateProviderProps) {
  const { state, loaded, error } = usePossiblyLoadedTxState()

  if (error) {
    return (
      <Flex width="100%" p="2" align="center" justify="center">
        <Callout.Root variant="soft" style={{ width: '100%', fontSize: 24 }}>
          <Callout.Icon>
            <ErrorIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      </Flex>
    )
  }

  if (!loaded) {
    return <LoadingIndicator message="Loading app state..." />
  }

  return (
    <TransactionStateContext.Provider value={state}> {children}</TransactionStateContext.Provider>
  )
}
