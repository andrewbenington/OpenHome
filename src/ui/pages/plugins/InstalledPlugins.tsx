import useBackend from '@openhome-core/backend/useBackend'
import { R } from '@openhome-core/util/functional'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext, Settings as SettingsType } from '@openhome-ui/state/appInfo'
import { OpenHomePlugin, PluginContext } from '@openhome-ui/state/plugin/reducer'
import { Badge, Spinner } from '@radix-ui/themes'
import { useContext, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { CURRENT_PLUGIN_API_VERSION } from './Plugins'
import './style.css'

export default function InstalledPlugins() {
  const { installedPlugins, deletePlugin } = useContext(PluginContext)

  return (
    <div className="plugin-page-content plugin-page-cards">
      {installedPlugins &&
        Object.entries(installedPlugins).map(([, metadata]) => (
          <InstalledPluginCard
            key={metadata.id}
            metadata={metadata}
            onDelete={() => deletePlugin(metadata.id)}
          />
        ))}
    </div>
  )
}

function InstalledPluginCard(props: { metadata: OpenHomePlugin; onDelete: (id: string) => void }) {
  const { metadata, onDelete } = props
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useBackend()
  const displayError = useDisplayError()
  const [iconPath, setIconPath] = useState<string>()

  const getPluginPath = useEffectEvent(backend.getPluginPath)
  const convertLocalImagePath = useEffectEvent(backend.convertLocalImagePath)
  const displayErrorEvent = useEffectEvent(displayError)

  useEffect(() => {
    getPluginPath(metadata.id).then(
      R.match(
        (pluginPath) => setIconPath(convertLocalImagePath(`${pluginPath}/icon.png`)),
        (error) => displayErrorEvent('Error Getting Plugin Path', error)
      )
    )
  }, [metadata.id])

  const outdated = metadata.api_version < CURRENT_PLUGIN_API_VERSION

  const enabled = useMemo(() => {
    return settings.enabledPlugins[metadata.id]
  }, [metadata, settings.enabledPlugins])

  async function updateSettings(newSettings: Partial<SettingsType>) {
    const updated = { ...settings, ...newSettings }
    await backend.updateSettings(updated).catch(console.error)
  }

  const handleCardClick = () => {
    dispatchAppInfoState({
      type: 'set_plugin_enabled',
      payload: { pluginID: metadata.id, enabled: !enabled },
    })
    updateSettings({ enabledPlugins: { ...settings.enabledPlugins, [metadata.id]: !enabled } })
  }

  return (
    <button className="plugin-display" style={{ cursor: 'pointer' }} onClick={handleCardClick}>
      {iconPath ? <img className="plugin-icon" src={iconPath} /> : <Spinner />}
      <Badge
        className="status-chip"
        color={outdated ? 'tomato' : enabled ? 'green' : 'gold'}
        variant="solid"
      >
        {outdated ? 'Outdated' : enabled ? 'Enabled' : 'Disabled'}
      </Badge>
      <div className="name-chip">{metadata.name}</div>
      <MdDelete
        className="delete-icon"
        onClick={(e) => {
          // Prevent card click (enable/disable) when clicking the delete icon
          e.stopPropagation()
          backend.deletePlugin(metadata.id).then(
            () => onDelete(metadata.id),
            (err) => displayError('Error Deleting Plugin', err)
          )
        }}
      />
    </button>
  )
}
