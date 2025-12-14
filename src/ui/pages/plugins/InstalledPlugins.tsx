import { BackendContext } from '@openhome-ui/backend/backendContext'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { PluginContext } from '@openhome-ui/state/plugin'
import { loadPlugin, PluginMetadataWithIcon } from '@openhome-ui/util/plugin'
import { Badge } from '@radix-ui/themes'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { MdDelete } from 'react-icons/md'
import { CURRENT_PLUGIN_API_VERSION } from './Plugins'
import './style.css'

export default function InstalledPlugins() {
  const displayError = useDisplayError()
  const [installedPlugins, setInstalledPlugins] = useState<PluginMetadataWithIcon[]>()
  const [{ settings }] = useContext(AppInfoContext)
  const [pluginState, dispatchPluginState] = useContext(PluginContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

  const loadInstalled = useCallback(
    async () =>
      backend
        .listInstalledPlugins()
        .then(
          E.match(
            (err) => {
              dispatchPluginState({ type: 'set_loaded', payload: true })
              displayError('Error Getting Installed Plugins', err)
            },
            (plugins) => setInstalledPlugins(plugins)
          )
        )
        .finally(() => dispatchPluginState({ type: 'set_loaded', payload: true })),
    [backend, displayError, dispatchPluginState]
  )

  useEffect(() => {
    if (installedPlugins && pluginState.loaded) return
    loadInstalled()
  }, [loadInstalled, installedPlugins, pluginState.loaded])

  const handleDeletePlugin = (pluginID: string) => {
    setInstalledPlugins((prevPlugins) =>
      prevPlugins ? prevPlugins.filter((plugin) => plugin.id !== pluginID) : []
    )
    dispatchPluginState({ type: 'remove_plugin', payload: pluginID })
  }

  return (
    <div style={{ gap: 8, display: 'flex', flexWrap: 'wrap', padding: 16 }}>
      {installedPlugins &&
        Object.entries(installedPlugins).map(([, metadata]) => (
          <InstalledPluginCard
            key={metadata.id}
            metadata={metadata}
            onDelete={handleDeletePlugin}
          />
        ))}
    </div>
  )
}

function InstalledPluginCard(props: {
  metadata: PluginMetadataWithIcon
  onDelete: (id: string) => void
}) {
  const { metadata, onDelete } = props
  const [, dispatchPluginState] = useContext(PluginContext)
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const outdated = metadata.api_version < CURRENT_PLUGIN_API_VERSION

  const enabled = useMemo(() => {
    return settings.enabledPlugins[metadata.id]
  }, [metadata, settings.enabledPlugins])

  const enablePlugin = useCallback(() => {
    backend.loadPluginCode(metadata.id).then(
      E.match(
        (err) => displayError('Load Plugin Code', err),
        (code) => {
          try {
            dispatchPluginState({ type: 'register_plugin', payload: loadPlugin(code) })
            dispatchAppInfoState({
              type: 'set_plugin_enabled',
              payload: { pluginID: metadata.id, enabled: true },
            })
          } catch (e) {
            displayError('Error Loading Plugin', `${e}`)
          }
        }
      )
    )
  }, [backend, dispatchAppInfoState, dispatchPluginState, displayError, metadata.id])

  const handleCardClick = () => {
    if (enabled) {
      dispatchPluginState({ type: 'remove_plugin', payload: metadata.id })
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
