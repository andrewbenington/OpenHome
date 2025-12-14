import { useState } from 'react'

export default function useIsDarkMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    setIsDarkMode(event.matches)
  })

  return isDarkMode
}
