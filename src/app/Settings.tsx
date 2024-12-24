import { Box, Button, Card, Stack, ToggleButtonGroup } from '@mui/joy'
import { useContext, useEffect, useState } from 'react'
import { SAVClass } from 'src/types/SAVTypes/util'
import { BackendContext } from '../backend/backendContext'
import { getRelevantGameLogos } from '../images/game'
import { getPublicImageURL } from '../images/images'
import { AppInfoContext } from '../state/appInfo'

export default function Settings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    backend.updateSettings(appInfoState.settings).catch(console.error)
  }, [appInfoState.settings, backend])

  const handleDownload = async (saveTypeID: string) => {
    setFeedback(`Downloading sprite pack for ${saveTypeID}...`)
    const result = await backend.downloadSpritePack(saveTypeID)

    if (result._tag === 'Right') {
      setFeedback(`Sprite pack for ${saveTypeID} downloaded successfully!`)
      setDownloadStatus((prev) => ({ ...prev, [saveTypeID]: true }))
    } else {
      setFeedback(`Error downloading sprite pack for ${saveTypeID}: ${result.left}`)
    }
  }

  const handleDelete = async (saveTypeID: string) => {
    setFeedback(`Deleting sprite pack for ${saveTypeID}...`)
    const result = await backend.deleteSpritePack(saveTypeID)

    if (result._tag === 'Right') {
      setFeedback(`Sprite pack for ${saveTypeID} deleted successfully!`)
      setDownloadStatus((prev) => ({ ...prev, [saveTypeID]: false }))
    } else {
      setFeedback(`Error deleting sprite pack for ${saveTypeID}: ${result.left}`)
    }
  }

  const handleBoxClick = async (saveType: SAVClass) => {
    const saveTypeID: string = saveType.saveTypeID
    if (downloadStatus[saveTypeID]) {
      await handleDelete(saveTypeID)
    } else {
      await handleDownload(saveTypeID)
    }
    dispatchAppInfoState({
      type: 'set_sprite_pack_downloaded',
      payload: { saveType: saveType, downloaded: !downloadStatus[saveTypeID] },
    })
  }

  return (
    <div>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ padding: 2 }}>
        <Card variant="outlined" sx={{ m: 1, maxWidth: 450 }}>
          <b>Enabled ROM Hack Formats</b>
          <div>
            {appInfoState.extraSaveTypes.map((saveType) => (
              <label style={{ display: 'flex', flexDirection: 'row' }} key={saveType.saveTypeName}>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    dispatchAppInfoState({
                      type: 'set_savetype_enabled',
                      payload: { saveType, enabled: e.target.checked },
                    })
                  }
                  checked={appInfoState.settings.enabledSaveTypes[saveType.saveTypeID]}
                />
                {saveType.saveTypeName}
              </label>
            ))}
          </div>

          <b>App Theme</b>
          <ToggleButtonGroup
            onChange={(_, newValue) => {
              if (!newValue) return
              backend.setTheme(newValue)
              dispatchAppInfoState({ type: 'set_app_theme', payload: newValue })
            }}
            color="primary"
            variant="soft"
            value={appInfoState.settings.appTheme}
          >
            <Button fullWidth value="system">
              System
            </Button>
            <Button fullWidth value="light">
              Light
            </Button>
            <Button fullWidth value="dark">
              Dark
            </Button>
          </ToggleButtonGroup>
        </Card>
        <Card variant="outlined" sx={{ m: 1, maxWidth: 400 }}>
          <b>Sprite Packs</b>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 2,
              padding: 2,
            }}
          >
            {appInfoState.officialSaveTypes.map((saveType) => {
              const logos = getRelevantGameLogos(saveType.saveTypeName)
              return (
                <Box
                  key={saveType.saveTypeID}
                  onClick={() => handleBoxClick(saveType)}
                  sx={{
                    backgroundColor: downloadStatus[saveType.saveTypeID] ? 'green' : 'red',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    padding: 2,
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {logos.map((logo, index) => (
                    <img
                      key={index}
                      src={getPublicImageURL(logo)}
                      alt={`${saveType.saveTypeName} Logo`}
                      style={{
                        width: '80%',
                        height: 'auto',
                        objectFit: 'contain',
                        marginBottom: 4,
                      }}
                    />
                  ))}
                </Box>
              )
            })}
          </Box>
          {feedback && <p style={{ marginTop: '16px' }}>{feedback}</p>}
        </Card>
      </Stack>
    </div>
  )
}
