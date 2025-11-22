import { ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

function FallbackComponent(props: FallbackProps) {
  const { error, resetErrorBoundary } = props

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
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
