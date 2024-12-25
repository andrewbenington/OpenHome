import { Button, Card, ToggleButtonGroup } from '@mui/joy'
import { useContext, useEffect } from 'react'
import { BackendContext } from '../backend/backendContext'
import { AppInfoContext } from '../state/appInfo'

export default function Settings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.updateSettings(appInfoState.settings).catch(console.error)
  }, [appInfoState.settings, backend])

  return (
    <div>
      <Card variant="outlined" sx={{ m: 1, maxWidth: 400 }}>
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
    </div>
  )
}
