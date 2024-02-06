import { Grid } from '@mui/material'
import { useMemo, useState } from 'react'
import { useAppDispatch } from '../../renderer/redux/hooks'
import { useLookupMaps, useRecentSaves } from '../../renderer/redux/selectors'
import { addSave } from '../../renderer/redux/slices/appSlice'
import { buildSaveFile } from '../../types/SAVTypes/util'
import RecentSaves from './RecentSaves'
import SuggestedSaves from './SuggestedSaves'
import { ParsedPath } from 'src/types/SAVTypes/path'

interface SaveFileSelectorProps {
  onClose: () => void
}

const SaveFileSelector = (props: SaveFileSelectorProps) => {
  const { onClose } = props
  const [, upsertRecentSave] = useRecentSaves()
  const [homeMonMap, gen12LookupMap, gen345LookupMap] = useLookupMaps()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState('recents')

  const openSaveFile = async (filePath?: ParsedPath) => {
    const { fileBytes, createdDate } = await window.electron.ipcRenderer.invoke(
      'read-save-file',
      filePath && [filePath]
    )
    if (filePath && fileBytes && homeMonMap) {
      const saveFile = buildSaveFile(filePath, fileBytes, {
        homeMonMap,
        gen12LookupMap,
        gen345LookupMap,
        fileCreatedDate: createdDate,
      })
      if (!saveFile) {
        onClose()
        return
      }
      onClose()
      upsertRecentSave(saveFile)
      dispatch(addSave(saveFile))
    }
  }

  const gridComponent = useMemo(() => {
    switch (tab) {
      case 'suggested':
        return <SuggestedSaves onOpen={openSaveFile} />
      case 'recents':
      default:
        return <RecentSaves onOpen={openSaveFile} />
    }
  }, [tab, openSaveFile])

  return (
    <Grid container style={{ height: '100%' }}>
      <Grid item xs={2}>
        <button onClick={() => openSaveFile()} style={{ margin: 8, width: 'calc(100% - 16px)' }}>
          Open File
        </button>
        <button
          style={{
            // ...styles.tabButton,
            backgroundColor: tab === 'recents' ? '#fff4' : '#0000',
            width: '100%',
            borderRadius: 0,
            textAlign: 'start',
          }}
          onClick={() => setTab('recents')}
        >
          Recents
        </button>
        <button
          style={{
            // ...styles.tabButton,
            backgroundColor: tab === 'suggested' ? '#fff4' : '#0000',
            width: '100%',
            borderRadius: 0,
            textAlign: 'start',
          }}
          onClick={() => setTab('suggested')}
        >
          Suggested
        </button>
      </Grid>
      <Grid item xs={10} style={{ height: '100%' }}>
        <div
          style={{
            height: 'calc(100% - 16px)',
            overflowY: 'scroll',
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {gridComponent}
        </div>
      </Grid>
    </Grid>
  )
}

export default SaveFileSelector
