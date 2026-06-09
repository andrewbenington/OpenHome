import { useVirtualizer } from '@tanstack/react-virtual'
import { RefObject, useEffect, useState } from 'react'

export default function useSimpleVirtualizer(
  count: number,
  estimateSize: (index: number, baseFontSize: number) => number,
  scrollRef: RefObject<HTMLElement | null>
) {
  // const scrollRef = useRef(null)
  const [baseFontSize, setBaseFontSize] = useState(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize)
  )

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimateSize(index, baseFontSize),
    overscan: 100,
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newBaseFont = parseFloat(getComputedStyle(document.documentElement).fontSize)
      setBaseFontSize(newBaseFont)
      virtualizer.setOptions({
        ...virtualizer.options,
        estimateSize: () => newBaseFont * 3,
      })
      virtualizer.measure()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'], // class changes can affect font-size too
    })
    return () => observer.disconnect()
  }, [virtualizer])

  return { ...virtualizer }
}
