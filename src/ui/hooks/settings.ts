import useBackend from '@openhome-core/backend/useBackend'
import { AppInfoContext, DeveloperFlag, Settings as SettingsType } from '@openhome-ui/state/appInfo'
import { useContext } from 'react'
import { MonDisplayState } from './monDisplay'

export default function useSettings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useBackend()

  async function updateSettings(newSettings: Partial<SettingsType>) {
    const updated = { ...appInfoState.settings, ...newSettings }
    dispatchAppInfoState({ type: 'load_settings', payload: updated })
    await backend.updateSettings(updated).catch(console.error)
  }

  async function updateMonDisplayState(newState: Partial<MonDisplayState>) {
    return updateSettings({
      monDisplayState: { ...appInfoState.settings.monDisplayState, ...newState },
    })
  }

  async function setDeveloperFlag(flag: DeveloperFlag, value: boolean) {
    const { flags: oldFlags } = appInfoState.settings.developerSettings

    const others = oldFlags.filter((other) => other !== flag)
    const flags = [...others, ...(value ? [flag] : [])]

    return updateSettings({
      developerSettings: {
        ...appInfoState.settings.developerSettings,
        flags,
      },
    })
  }

  return {
    settings: appInfoState.settings,
    updateSettings,
    monDisplayState: appInfoState.settings.monDisplayState,
    updateMonDisplayState,
    developerSettings: appInfoState.settings.developerSettings,
    setDeveloperFlag,
    extraSaveTypes: appInfoState.extraSaveTypes,
  }
}
