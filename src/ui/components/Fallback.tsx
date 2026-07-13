import { ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

function BaseFallbackComponent(props: FallbackProps & { children?: ReactNode }) {
  const { error, children } = props

  const errorMessage = errorHasMessage(error) ? error.message : String(error)

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{errorMessage}</pre>
      <p>{JSON.stringify(Object.getPrototypeOf(error))}</p>
      {children}
    </div>
  )
}

function RetryFallbackComponent(props: FallbackProps) {
  const { resetErrorBoundary } = props

  return (
    <BaseFallbackComponent {...props}>
      <button onClick={resetErrorBoundary}>Try again</button>
    </BaseFallbackComponent>
  )
}

function FatalFallbackComponent(props: FallbackProps) {
  return (
    <BaseFallbackComponent {...props}>
      <p>
        This error is unrecoverable. Please report this to the developer, and quit/reopen the app.
      </p>
    </BaseFallbackComponent>
  )
}

type OpenHomeFallbackProps = {
  children: ReactNode
  fatal?: boolean
}

export default function Fallback({ children, fatal }: OpenHomeFallbackProps) {
  return (
    <ErrorBoundary FallbackComponent={fatal ? FatalFallbackComponent : RetryFallbackComponent}>
      {children}
    </ErrorBoundary>
  )
}

function errorHasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}
