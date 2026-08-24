import { useEffect, useRef } from 'react'

export default function useValueChanged<T>(
  value: T,
  label: string,
  display?: (value: T) => string
) {
  const displayFunction = useRef(display)
  return useEffect(() => {
    console.info('CONSOLE_ONLY', `${label} changed:`, displayFunction.current?.(value) ?? value)
  }, [label, value])
}
