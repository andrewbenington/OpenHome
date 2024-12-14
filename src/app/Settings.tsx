import { Card } from '@mui/joy'
import { useContext, useEffect } from 'react'
import { BackendContext } from '../backend/backendProvider'
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
        <div>
          <b>Enabled ROM Hack Formats</b>
        </div>
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
                checked={appInfoState.settings.enabledSaveTypes[saveType.name]}
              />
              {saveType.saveTypeName}
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}
