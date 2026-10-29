import { ReactVirtualizerOptions, useVirtualizer } from '@tanstack/react-virtual'
import { RefObject, useEffect, useState } from 'react'

type SimpleVirtualizerOptions = Omit<
  Partial<ReactVirtualizerOptions<HTMLElement, Element>>,
  'count' | 'estimateSize' | 'getScrollElement'
>

export default function useSimpleVirtualizer(
  count: number,
  estimateSize: (index: number, baseFontSize: number) => number,
  scrollRef: RefObject<HTMLElement | null>,
  options?: SimpleVirtualizerOptions
) {
  const [baseFontSize, setBaseFontSize] = useState(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize)
  )

  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimateSize(index, baseFontSize),
    overscan: 100,
    directDomUpdates: true,
    ...options,
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newBaseFont = parseFloat(getComputedStyle(document.documentElement).fontSize)
      setBaseFontSize(newBaseFont)
      virtualizer.setOptions({
        ...virtualizer.options,
        estimateSize: (index) => estimateSize(index, newBaseFont),
      })
      virtualizer.measure()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'], // class changes can affect font-size too
    })
    return () => observer.disconnect()
  }, [estimateSize, virtualizer])

  return virtualizer
}
