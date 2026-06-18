import { useEffect } from 'react'

export default function useValueChanged<T>(value: T, label: string) {
  return useEffect(() => {
    console.info('CONSOLE_ONLY', `${label} changed:`, value)
  }, [label, value])
}
