import { useEffect, useRef } from 'react'

export default function useDebounce<T extends (...args: any) => void>(callback: T, delay: number) {
  const latestCallback = useRef<typeof callback>(callback)
  const timeoutId = useRef<NodeJS.Timeout>(undefined)

  useEffect(() => {
    latestCallback.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current)
      }
    }
  }, [delay])

  const debouncedFunction = (...args: Parameters<typeof callback>) => {
    clearTimeout(timeoutId.current)
    timeoutId.current = setTimeout(() => {
      latestCallback.current(...args)
    }, delay)
  }

  return debouncedFunction
}
