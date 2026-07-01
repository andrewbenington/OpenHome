import { OHPKM } from '@openhome-core/pkm/OHPKM'
import useDebounce from '@openhome-ui/hooks/debounce'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { TextArea } from '@radix-ui/themes'
import { useEffect, useState } from 'react'

export default function NotesDisplay(props: { mon: OHPKM }) {
  const { mon } = props
  const [notesText, setNotesText] = useState(mon.notes ?? '')
  const { updateMonNotes } = useOhpkmStore()

  useEffect(() => {
    setNotesText(mon.notes ?? '')
  }, [mon])

  const debouncedNotesUpdate = useDebounce((notes: string) => {
    updateMonNotes(mon.openhomeId, notes || undefined)
  }, 500)

  return (
    <div style={{ padding: 8, height: 'calc(100% - 16px)' }}>
      <TextArea
        value={notesText}
        onChange={(e) => {
          setNotesText(e.target.value)
          debouncedNotesUpdate(e.target.value)
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}
