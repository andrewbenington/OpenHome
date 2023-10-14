import { MoreVert } from '@mui/icons-material'
import { IconButton, useTheme } from '@mui/material'
import { GameOfOriginData } from '../../consts'
import { useAppDispatch } from '../../renderer/redux/hooks'
import { useLookupMaps, useRecentSaves } from '../../renderer/redux/selectors'
import { addSave } from '../../renderer/redux/slices/appSlice'
import { buildSaveFile } from '../../types/SAVTypes/util'
import { SaveRef, getSaveTypeString } from '../../types/types'
import OpenHomeButton from '../components/OpenHomeButton'
import { getGameLogo } from '../images/game'
import { getPublicImageURL } from '../images/images'

interface SaveFileSelectorProps {
  onClose: () => void
}

const getSaveLogo = (ref: SaveRef) => {
  return getPublicImageURL(getGameLogo(parseInt(ref.game ?? '0')))
}

const formatTimeSince = (timestamp: number) => {
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

const SaveFileSelector = (props: SaveFileSelectorProps) => {
  const { onClose } = props
  const { palette } = useTheme()
  const [recentSaves, upsertRecentSave] = useRecentSaves()
  const [homeMonMap, gen12LookupMap, gen345LookupMap] = useLookupMaps()
  const dispatch = useAppDispatch()

  const openSaveFile = async (filePath?: string) => {
    const { path, fileBytes, createdDate } = await window.electron.ipcRenderer.invoke(
      'read-save-file',
      filePath && [filePath]
    )
    if (path && fileBytes && homeMonMap) {
      const saveFile = buildSaveFile(path, fileBytes, {
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

  return (
    <div
      className="scroll-no-bar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        position: 'relative',
        padding: 5,
        overflow: 'scroll',
      }}
    >
      <OpenHomeButton
        onClick={() => openSaveFile()}
        style={{
          width: 'calc(50% - 10px)',
          height: 150,
          margin: 5,
          padding: 10,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: 0.5,
          boxShadow:
            '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        }}
      >
        <div
          style={{
            fontSize: 40,
            margin: 'auto',
          }}
        >
          +
        </div>
      </OpenHomeButton>
      {Object.values(recentSaves)
        .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0))
        .map((ref, i) => (
          <OpenHomeButton
            key={`save_file_${i}`}
            onClick={() => openSaveFile(ref.filePath)}
            style={{
              width: 'calc(50% - 10px)',
              height: 150,
              margin: 5,
              padding: 10,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: palette.secondary.light,
              color: palette.text.secondary,
              boxShadow:
                '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
            }}
          >
            <img
              alt="save logo"
              width={150}
              src={getSaveLogo(ref)}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translate(0%, -50%)',
                opacity: 0.3,
                zIndex: 0,
              }}
            />
            <div
              style={{
                textAlign: 'left',
                width: '100%',
                fontSize: 20,
                zIndex: 2,
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {ref.game
                  ? `Pokémon ${GameOfOriginData[parseInt(ref.game)]?.name}`
                  : getSaveTypeString(ref.saveType)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>{ref.trainerName}</span>
                {` (ID ${ref.trainerID})`}
              </div>
              <div>{ref.lastOpened ? formatTimeSince(ref.lastOpened) : ''}</div>
            </div>
            <div
              style={{
                zIndex: 2,
                textOverflow: 'ellipsis',
                overflowX: 'hidden',
                textAlign: 'right',
                direction: 'rtl',
                color: '#333',
              }}
            >
              {ref.filePath}
            </div>
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
              }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                zIndex: 3,
                color: palette.text.secondary,
              }}
            >
              <MoreVert />
            </IconButton>
          </OpenHomeButton>
        ))}
    </div>
  )
}

export default SaveFileSelector
