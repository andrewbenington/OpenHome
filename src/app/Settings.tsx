import { Card, RadioGroup } from '@radix-ui/themes'
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
      <Card style={{ margin: 8, maxWidth: 400 }}>
        <b>Enabled ROM Hack Formats</b>
        <div style={{ margin: 8 }}>
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
        <RadioGroup.Root
          onValueChange={(newValue: 'light' | 'dark' | 'system') => {
            if (!newValue) return
            backend.setTheme(newValue)
            dispatchAppInfoState({ type: 'set_app_theme', payload: newValue })
          }}
          value={appInfoState.settings.appTheme}
          style={{ margin: 8 }}
        >
          <RadioGroup.Item value="system">System</RadioGroup.Item>
          <RadioGroup.Item value="light">Light</RadioGroup.Item>
          <RadioGroup.Item value="dark">Dark</RadioGroup.Item>
        </RadioGroup.Root>
      </Card>
    </div>
  )
}
