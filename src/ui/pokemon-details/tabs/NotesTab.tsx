import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { useSaves } from '@openhome-ui/state/saves'
import { TextArea } from '@radix-ui/themes'
import { useEffect, useState } from 'react'

export default function NotesDisplay(props: { mon: OHPKM }) {
  const { mon } = props
  const [notesText, setNotesText] = useState(mon.notes ?? '')
  const { updateMonNotes } = useSaves()

  useEffect(() => {
    setNotesText(mon.notes ?? '')
  }, [mon])

  return (
    <div style={{ padding: 8, height: 'calc(100% - 16px)' }}>
      <TextArea
        value={notesText}
        onChange={(e) => {
          setNotesText(e.target.value)
          updateMonNotes(mon.openhomeId, e.target.value ?? '')
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}
