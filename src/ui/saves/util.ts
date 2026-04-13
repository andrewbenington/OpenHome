import { SAV } from '@openhome-core/save/interfaces'
import { Option } from '@openhome-core/util/functional'
import { SaveRef } from '@openhome-core/util/types'
import BackendInterface from '@openhome-ui/backend/backendInterface'
import { CtxMenuElementBuilder, ItemBuilder } from '@openhome-ui/components/context-menu/types'
import { OriginGames } from '@pkm-rs/pkg'
import dayjs from 'dayjs'
import { useState } from 'react'
import { OPENHOME_BOX_SLOTS, useBanksAndBoxes } from '../state-zustand/banks-and-boxes/store'

export type SaveViewMode = 'card' | 'grid'

export function logoFromSaveRef(ref: SaveRef): string | undefined {
  return ref.pluginIdentifier
    ? `logos/${ref.pluginIdentifier}.png`
    : ref.game
      ? OriginGames.logoPath(ref.game)
      : undefined
}

export function formatTimeSince(timestamp?: number) {
  if (!timestamp) return ''
  const now = Date.now()
  const seconds = Math.floor((now - timestamp) / 1000)
  let interval = seconds / 31536000

  if (interval > 1) {
    return `${Math.floor(interval)} year${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return `${Math.floor(interval)} month${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 86400
  if (interval > 1) {
    return `${Math.floor(interval)} day${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 3600
  if (interval > 1) {
    return `${Math.floor(interval)} hour${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  interval = seconds / 60
  if (interval > 1) {
    return `${Math.floor(interval)} minute${Math.floor(interval) > 1 ? 's' : ''} ago`
  }
  return `${Math.floor(seconds)} second${Math.floor(seconds) > 1 ? 's' : ''} ago`
}

export function formatTime(timestamp?: number) {
  if (!timestamp) return ''

  const now = dayjs()
  const todayString = now.format('MM/DD/YYYY')
  const yesterdayString = now.add(-1, 'day').format('MM/DD/YYYY')
  const date = dayjs.unix(timestamp / 1000)
  const dateString = date.format('MM/DD/YYYY')

  if (dateString === todayString) {
    return date.format('[Today at] h:mm:ss a')
  } else if (dateString === yesterdayString) {
    return date.format('[Yesterday at] h:mm:ss a')
  } else {
    return date.format('MMM D YYYY [at] h:mm:ss a')
  }
}

export function filterEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function getNextFullSlotBoxWrapping(save: SAV, boxNum: number, boxSlot: number): number {
  let peekSlot = boxSlot
  function slotIsEmpty(index: number) {
    return save.getMonAt(boxNum, index) === undefined
  }

  do {
    peekSlot = (peekSlot + 1) % save.boxSlotCount
  } while (peekSlot !== boxSlot && slotIsEmpty(peekSlot))

  return peekSlot
}

export function getPrevFullSlotBoxWrapping(save: SAV, boxNum: number, boxSlot: number): number {
  let peekSlot = boxSlot
  function slotIsEmpty(index: number) {
    return save.getMonAt(boxNum, index) === undefined
  }

  do {
    peekSlot = moduloUnderflowWrap(peekSlot - 1, save.boxSlotCount)
  } while (peekSlot !== boxSlot && slotIsEmpty(peekSlot))

  return peekSlot
}

function moduloUnderflowWrap(a: number, b: number): number {
  return ((a % b) + b) % b
}

export function useOpenHomeBoxNavigator() {
  const { getCurrentBox } = useBanksAndBoxes()
  const [currentIndex, setCurrentIndex] = useState<number>()

  function navigateNext() {
    if (currentIndex === undefined) return
    const currentBox = getCurrentBox()
    for (
      let i = (currentIndex + 1) % OPENHOME_BOX_SLOTS;
      i !== currentIndex;
      i = (i + 1) % OPENHOME_BOX_SLOTS
    ) {
      if (currentBox.identifiers.has(i)) {
        setCurrentIndex(i)
        break
      }
    }
  }

  function navigatePrev() {
    if (currentIndex === undefined) return
    const currentBox = getCurrentBox()
    for (
      let i = moduloUnderflowWrap(currentIndex - 1, OPENHOME_BOX_SLOTS);
      i !== currentIndex;
      i = moduloUnderflowWrap(i - 1, OPENHOME_BOX_SLOTS)
    ) {
      if (currentBox.identifiers.has(i)) {
        setCurrentIndex(i)
        break
      }
    }
  }

  return {
    currentIndex,
    setCurrentIndex,
    navigatePrev,
    navigateNext,
  }
}

export function useBoxNavigator(save: SAV, boxNum: number, boxSlot: Option<number>) {
  const [currentSlot, setCurrentSlot] = useState<Option<number>>(boxSlot)

  function navigateNext() {
    if (currentSlot === undefined) return
    setCurrentSlot(getNextFullSlotBoxWrapping(save, boxNum, currentSlot))
  }

  function navigatePrev() {
    if (currentSlot === undefined) return
    setCurrentSlot(getPrevFullSlotBoxWrapping(save, boxNum, currentSlot))
  }

  return {
    currentSlot,
    setCurrentSlot,
    navigateNext,
    navigatePrev,
  }
}

export function buildRecentSaveContextElements(
  save: SaveRef,
  backend: BackendInterface,
  removeRecentSave?: (path: string) => void
): Option<CtxMenuElementBuilder>[] {
  return [
    removeRecentSave
      ? ItemBuilder.fromLabel('Remove Save').withAction(() => removeRecentSave(save.filePath.raw))
      : undefined,
    ItemBuilder.fromLabel(
      `Reveal in ${backend.getPlatform() === 'macos' ? 'Finder' : 'File Explorer'}`
    ).withAction(() => backend.openDirectory(save.filePath.dir)),
  ]
}
