import { BackendContext } from '@openhome-ui/backend/backendContext'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { Badge, Flex } from '@radix-ui/themes'
import { useCallback, useContext, useMemo } from 'react'
import { MdDelete } from 'react-icons/md'
import { OpenHomePlugin, PluginContext } from 'src/ui/state/plugin/reducer'
import { CURRENT_PLUGIN_API_VERSION } from './Plugins'
import './style.css'

export default function InstalledPlugins() {
  const { installedPlugins, deletePlugin } = useContext(PluginContext)

  return (
    <Flex gap="2" wrap="wrap" p="4" align="start" justify="start" style={{ alignContent: 'start' }}>
      {installedPlugins &&
        Object.entries(installedPlugins).map(([, metadata]) => (
          <InstalledPluginCard
            key={metadata.id}
            metadata={metadata}
            onDelete={() => deletePlugin(metadata.id)}
          />
        ))}
    </Flex>
  )
}

function InstalledPluginCard(props: { metadata: OpenHomePlugin; onDelete: (id: string) => void }) {
  const { metadata, onDelete } = props
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const outdated = metadata.api_version < CURRENT_PLUGIN_API_VERSION

  const enabled = useMemo(() => {
    return settings.enabledPlugins[metadata.id]
  }, [metadata, settings.enabledPlugins])

  const enablePlugin = useCallback(() => {
    dispatchAppInfoState({
      type: 'set_plugin_enabled',
      payload: { pluginID: metadata.id, enabled: true },
    })
  }, [dispatchAppInfoState, metadata.id])

  const handleCardClick = () => {
    if (enabled) {
      dispatchAppInfoState({
        type: 'set_plugin_enabled',
        payload: { pluginID: metadata.id, enabled: false },
      })
    } else {
      enablePlugin()
    }
  }

  return (
    <button className="plugin-display" style={{ cursor: 'pointer' }} onClick={handleCardClick}>
      {metadata.icon_image && (
        <img
          className="plugin-icon"
          src={`data:image/${metadata.icon_image.extension};base64,${metadata.icon_image.base64}`}
        />
      )}
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
