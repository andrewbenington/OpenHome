import { ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

function FallbackComponent(props: FallbackProps) {
  const { error, resetErrorBoundary } = props

  const errorMessage = errorHasMessage(error) ? error.message : String(error)

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{errorMessage}</pre>
      <p>{JSON.stringify(Object.getPrototypeOf(error))}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

type OpenHomeFallbackProps = {
  children: ReactNode
}

export default function Fallback({ children }: OpenHomeFallbackProps) {
  return <ErrorBoundary FallbackComponent={FallbackComponent}>{children}</ErrorBoundary>
}

function errorHasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}
