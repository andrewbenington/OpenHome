import { BackendContext } from '@openhome-ui/backend/backendContext'
import { AppInfoContext, AppTheme } from '@openhome-ui/state/appInfo'
import {
  BoolOption,
  ConvertStrategies,
  ConvertStrategy,
  getConvertSettingsSchema,
  getDefaultConvertStrategy,
  NumberOption,
  SettingType,
  StringOption,
} from '@pkm-rs/pkg'
import { Card, RadioGroup, Select, Separator } from '@radix-ui/themes'
import { ReactNode, useContext, useEffect } from 'react'
import { Route, Routes } from 'react-router'
import { stringSorter } from 'src/core/util/sort'
import SideTabs from '../components/side-tabs/SideTabs'
import { usePathSegment } from '../hooks/routing'
import { ConvertStrategyKey, useConvertStrategies } from '../state/convert-strategies'

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
        <Route path="conversion" element={<PKMConversion2 />} />
      </Routes>
    </SideTabs.Root>
  )
}

function PKMConversion2() {
  const schema = getConvertSettingsSchema().settings_schema
  return (
    <Card style={{ margin: 8, width: '100%' }}>
      <b>PKM Conversion Settings</b>
      <Separator style={{ margin: '8px 0' }} />
      <div style={{ fontSize: 12 }}>
        {Object.entries(schema)
          .toSorted(stringSorter(([key]) => key))
          .map(([key, setting]) => (
            <PKMConversionSettingControl
              key={key}
              identifier={key as ConvertStrategyKey}
              descriptor={setting}
            />
          ))}
      </div>
    </Card>
  )
}

type ConvertSettingControlRenderer = (
  ifString: (descriptor: StringOption) => ReactNode,
  ifNumber: (descriptor: NumberOption) => ReactNode,
  ifBool: (descriptor: BoolOption) => ReactNode
) => ReactNode

function convertSettingControlRenderer(descriptor: SettingType): ConvertSettingControlRenderer {
  return (
    ifString: (descriptor: StringOption) => ReactNode,
    ifNumber: (descriptor: NumberOption) => ReactNode,
    ifBool: (descriptor: BoolOption) => ReactNode
  ) => {
    if ('Bool' in descriptor) {
      return ifBool(descriptor.Bool)
    }
    if ('String' in descriptor) {
      return ifString(descriptor.String)
    }
    return ifNumber(descriptor.Number)
  }
}

interface PKMConversionSettingControlProps {
  identifier: ConvertStrategyKey
  descriptor: SettingType
}

function PKMConversionSettingControl({ identifier, descriptor }: PKMConversionSettingControlProps) {
  const defaultStrategy = getDefaultConvertStrategy()
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ display: 'inline-flex' }}>
        {convertSettingControlRenderer(descriptor)(
          (stringDescriptor) => (
            <PKMStringConversionSettingControl
              identifier={identifier}
              descriptor={stringDescriptor}
              currentSettings={defaultStrategy}
            />
          ),
          (_numberDescriptor) => (
            <p style={{ margin: 0, color: 'var(--gray-11)' }}>
              {ConvertStrategies.getCategoryName(identifier)}:
            </p>
          ),
          (boolDescriptor) => (
            <PKMBoolConversionSettingControl
              identifier={identifier}
              descriptor={boolDescriptor}
              currentSettings={defaultStrategy}
            />
          )
        )}
      </span>
    </div>
  )
}

interface PKMBoolConversionSettingControlProps {
  identifier: ConvertStrategyKey
  descriptor: BoolOption
  currentSettings: ConvertStrategy
}

function PKMBoolConversionSettingControl({
  identifier,
  descriptor,
}: PKMBoolConversionSettingControlProps) {
  const { defaultConvertStrategy, updateDefaultConvertStrategy } = useConvertStrategies()
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ display: 'inline-flex' }}>
        <p style={{ margin: 0, color: 'var(--gray-11)' }}>
          {ConvertStrategies.getCategoryName(identifier)}:
        </p>
        <b style={{ paddingLeft: 8 }}>{ConvertStrategies.getSettingName(identifier)}</b>
        <input
          type="checkbox"
          onChange={(e) =>
            updateDefaultConvertStrategy({
              ...defaultConvertStrategy,
              [identifier]: e.target.checked,
            })
          }
          checked={
            (defaultConvertStrategy[identifier as keyof ConvertStrategy] as boolean | undefined) ??
            descriptor.default
          }
          style={{ marginLeft: 8 }}
        />
      </span>
      <p style={{ marginTop: 4, color: 'var(--gray-11)' }}>
        {ConvertStrategies.getDescription(identifier)}
      </p>
    </div>
  )
}

interface PKMStringConversionSettingControlProps {
  identifier: ConvertStrategyKey
  descriptor: StringOption
  currentSettings: ConvertStrategy
}

function PKMStringConversionSettingControl({
  identifier,
  descriptor,
}: PKMStringConversionSettingControlProps) {
  const { defaultConvertStrategy, updateDefaultConvertStrategy } = useConvertStrategies()
  const value = defaultConvertStrategy[identifier] as string | undefined
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ display: 'inline-flex' }}>
        <p style={{ margin: 0, color: 'var(--gray-11)' }}>
          {ConvertStrategies.getCategoryName(identifier)}:
        </p>
        <b style={{ paddingLeft: 8 }}>{ConvertStrategies.getSettingName(identifier)}</b>
      </span>
      <p style={{ marginTop: 4, color: 'var(--gray-11)' }}>
        {ConvertStrategies.getDescription(identifier)}
      </p>
      <Select.Root
        value={value}
        onValueChange={(newValue) =>
          updateDefaultConvertStrategy({
            ...defaultConvertStrategy,
            [identifier]: newValue,
          })
        }
        size="1"
      >
        <Select.Trigger style={{ display: 'flex' }} />
        <Select.Content side="right">
          {descriptor.allowed_values?.map((option) => (
            <Select.Item key={option} value={option}>
              {option}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  )
}
