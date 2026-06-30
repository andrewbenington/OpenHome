import { R } from '@openhome-core/util/functional'
import { stringSorter } from '@openhome-core/util/sort'
import { AppBackend } from '@openhome-ui/backend'
import ContentCard from '@openhome-ui/components/ContentCard'
import SideTabNavigation from '@openhome-ui/components/side-tabs/SideTabNavigation'
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
import { Flex, RadioGroup, Select, Separator } from '@radix-ui/themes'
import { ReactNode, useContext, useEffect, useState } from 'react'
import PromptDialog from '../components/dialog/PromptDialog'
import useDisplayError from '../hooks/displayError'
import { ConvertStrategyKey, useConvertStrategies } from '../state/convert-strategies'
import './Settings.css'

export default function Settings() {
  return (
    <SideTabNavigation
      defaultTab="general"
      parentPathSegment="settings"
      routes={[
        {
          route: 'general',
          display: 'General',
          component: <GeneralSettings />,
        },
        {
          route: 'conversion',
          display: 'PKM Conversion',
          component: <PKMConversion />,
        },
      ]}
    />
  )
}

function GeneralSettings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const [dataDirPath, setDataDirPath] = useState<string>()
  const displayError = useDisplayError()

  useEffect(() => {
    AppBackend.getDataDirPath().then(R.match((value) => setDataDirPath(value), console.error))
  }, [displayError])

  useEffect(() => {
    AppBackend.updateSettings(appInfoState.settings).catch(console.error)
  }, [appInfoState.settings])

  return (
    <ContentCard>
      <div className="settings-content-inner">
        <div>
          <GroupHeader name="Enabled ROM Hack Formats" />
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
        </div>
        <div>
          <GroupHeader name="App Theme" />
          <RadioGroup.Root
            onValueChange={(newValue: AppTheme) => {
              if (!newValue) return
              AppBackend.setTheme(newValue)
              dispatchAppInfoState({ type: 'set_app_theme', payload: newValue })
            }}
            value={appInfoState.settings.appTheme}
            style={{ margin: 8 }}
          >
            <RadioGroup.Item value="system">System</RadioGroup.Item>
            <RadioGroup.Item value="light">Light</RadioGroup.Item>
            <RadioGroup.Item value="dark">Dark</RadioGroup.Item>
          </RadioGroup.Root>
        </div>
        <div>
          <GroupHeader name="Data" />
          <Flex direction="column" gap="2">
            <div>
              Your OpenHome data is stored locally on your machine. You can change the location of
              this data here. Note that changing the data directory will cause the app to restart.
            </div>
            <Flex gap="2">
              <b>Current Data Directory:</b>
              <div>{dataDirPath}</div>
              <PromptDialog
                title="Move Data Directory?"
                description="Are you sure you want to move the data directory? All files will be copied to the new location, and the app will restart. After they are copied to the new directory successfully, your storage and plugins will be removed from the old directory."
                triggerButton="Change"
                actions={[
                  { uniqueLabel: 'Cancel', action: () => {}, type: 'cancel' },
                  {
                    uniqueLabel: 'Select New Directory...',
                    action: () => {
                      AppBackend.promptChangeDataDir().then(
                        R.mapErr((err) => displayError('Error changing data directory', err))
                      )
                    },
                    type: 'destructive',
                  },
                ]}
              />
            </Flex>
          </Flex>
        </div>
      </div>
    </ContentCard>
  )
}

function GroupHeader(props: { name: string }) {
  return (
    <div>
      <p className="group-name">{props.name}</p>
      <Separator style={{ margin: 'var(--padding-radius-sm-lg) 0' }} />
    </div>
  )
}

function PKMConversion() {
  const schema = getConvertSettingsSchema().settings_schema

  const grouped = Object.groupBy(Object.entries(schema), ([identifier]) =>
    ConvertStrategies.getCategoryName(identifier as ConvertStrategyKey)
  )

  return (
    <ContentCard>
      <div className="settings-content-inner">
        {Object.entries(grouped)
          .toSorted(stringSorter(([category]) => category))
          .map(([category, settings]) => (
            <div key={category} className="settings-group">
              <GroupHeader name={category} />
              {settings?.map(([identifier, setting]) => (
                <PKMConversionSettingControl
                  key={identifier}
                  identifier={identifier as ConvertStrategyKey}
                  descriptor={setting}
                />
              ))}
            </div>
          ))}
      </div>
    </ContentCard>
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
    <div>
      <span className="settings-checkbox-flex">
        {convertSettingControlRenderer(descriptor)(
          (stringDescriptor) => (
            <PKMStringConversionSettingControl
              identifier={identifier}
              descriptor={stringDescriptor}
              currentSettings={defaultStrategy}
            />
          ),
          (_numberDescriptor) => (
            <p>{ConvertStrategies.getCategoryName(identifier)}:</p>
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
    <div className="single-setting-container">
      <span className="settings-checkbox-flex">
        <p>{ConvertStrategies.getSettingName(identifier)}</p>
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
        />
      </span>
      <p className="setting-description">{ConvertStrategies.getDescription(identifier)}</p>
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
    <div className="single-setting-container">
      <p>{ConvertStrategies.getSettingName(identifier)}</p>
      <p className="setting-description">{ConvertStrategies.getDescription(identifier)}</p>
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
        <Select.Trigger />
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
