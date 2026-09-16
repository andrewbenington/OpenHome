import useBackend from '@openhome-core/backend/useBackend'
import { AppInfoContext, Settings as SettingsType } from '@openhome-ui/state/appInfo'
import { useContext } from 'react'

export default function useSettings() {
  const [appInfoState, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useBackend()

  async function updateSettings(newSettings: Partial<SettingsType>) {
    const updated = { ...appInfoState.settings, ...newSettings }
    dispatchAppInfoState({ type: 'load_settings', payload: updated })
    await backend.updateSettings(updated).catch(console.error)
  }

  return {
    settings: appInfoState.settings,
    updateSettings,
    extraSaveTypes: appInfoState.extraSaveTypes,
  }
}
