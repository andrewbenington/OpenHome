import { BackendContext } from '@openhome-ui/backend/backendContext'
import { AppInfoContext, AppTheme } from '@openhome-ui/state/appInfo'
import { Card, RadioGroup, Select, Separator } from '@radix-ui/themes'
import { useContext, useEffect } from 'react'
import { Route, Routes } from 'react-router'
import {
  ConversionStrategy,
  DefaultConversionStrategy,
  displaySettingsCategory,
  getSettingsCategory,
  SETTINGS_SCHEMA,
  SettingsSubcategory,
} from '../../../packages/pokemon-files/src/conversion/settings'
import SideTabs from '../components/side-tabs/SideTabs'
import { usePathSegment } from '../hooks/routing'

export default function Settings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const { currentSegment, setCurrentSegment } = usePathSegment('settings', 'general')

  useEffect(() => {
    backend.updateSettings(appInfoState.settings).catch(console.error)
  }, [appInfoState.settings, backend])

  const generalElement = (
    <Card style={{ margin: 8, width: '100%' }}>
      <b>Enabled ROM Hack Formats</b>
      <div style={{ margin: 8 }}>
        {appInfoState.extraSaveTypes.map((saveType) => (
          <label className="flex-row" key={saveType.saveTypeName}>
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
        onValueChange={(newValue: AppTheme) => {
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
  )

  return (
    <SideTabs.Root value={currentSegment} onValueChange={setCurrentSegment}>
      <SideTabs.TabList>
        <SideTabs.Tab value="general">General</SideTabs.Tab>
        <SideTabs.Tab value="conversion">PKM Conversion</SideTabs.Tab>
        <div style={{ flex: 1 }} />
      </SideTabs.TabList>
      <Routes>
        <Route index path="" element={generalElement} />
        <Route path="general" element={generalElement} />
        <Route
          path="conversion"
          element={<PKMConversion conversionSettings={DefaultConversionStrategy} />}
        />
      </Routes>
    </SideTabs.Root>
  )
}

interface PKMConversionProps {
  conversionSettings: ConversionStrategy
}

function PKMConversion({ conversionSettings }: PKMConversionProps) {
  return (
    <Card style={{ margin: 8, width: '100%' }}>
      <b>PKM Conversion Settings</b>
      <Separator style={{ margin: '8px 0' }} />
      <div style={{ fontSize: 12 }}>
        {Object.entries(SETTINGS_SCHEMA).map(([key, setting]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <span style={{ display: 'inline-flex' }}>
              <p style={{ margin: 0, color: 'var(--gray-11)' }}>
                {displaySettingsCategory(getSettingsCategory(key as SettingsSubcategory))}:
              </p>
              <b style={{ paddingLeft: 8 }}>{setting.display}</b>
              {setting.type === 'boolean' && (
                <input
                  type="checkbox"
                  onChange={
                    (e) => console.log(`New value for ${key}:`, e.target.checked) /* TODO */
                  }
                  checked={
                    (conversionSettings[key as keyof ConversionStrategy] as boolean | undefined) ??
                    setting.default
                  }
                  style={{ marginLeft: 8 }}
                />
              )}
            </span>
            <p style={{ marginTop: 4, color: 'var(--gray-11)' }}>{setting.description}</p>
            {setting.type === 'string' && setting.enum && (
              <Select.Root
                value={
                  conversionSettings[key as keyof ConversionStrategy] as (typeof setting)['default']
                }
                size="1"
              >
                <Select.Trigger style={{ display: 'flex' }} />
                <Select.Content side="right">
                  {setting.enum.map((option) => (
                    <Select.Item key={option} value={option}>
                      {option}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
