import { Chip, Dropdown, Menu, MenuButton, MenuItem } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import useDisplayError from 'src/hooks/displayError'
import { AppInfoContext } from 'src/state/appInfo'
import { PluginContext } from 'src/state/plugin'
import { loadPlugin, PluginMetadataWithIcon } from 'src/util/Plugin'
import './style.css'

export default function InstalledPlugins() {
  const displayError = useDisplayError()
  const [installedPlugins, setInstalledPlugins] = useState<PluginMetadataWithIcon[]>()
  const [{ settings }] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

  const loadInstalled = useCallback(
    async () =>
      backend.listInstalledPlugins().then(
        E.match(
          (err) => displayError('Error Getting Installed Plugins', err),
          (plugins) => setInstalledPlugins(plugins)
        )
      ),
    [backend, displayError]
  )

  useEffect(() => {
    loadInstalled()
  }, [loadInstalled])

  return (
    <div style={{ gap: 8, display: 'flex', flexWrap: 'wrap', padding: 16 }}>
      {installedPlugins &&
        Object.entries(installedPlugins).map(([, metadata]) => (
          <InstalledPluginCard key={metadata.id} metadata={metadata} />
        ))}
    </div>
  )
}

function InstalledPluginCard(props: { metadata: PluginMetadataWithIcon }) {
  const { metadata } = props
  const [, dispatchPluginState] = useContext(PluginContext)
  const [{ settings }, dispatchAppInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const enabled = useMemo(() => {
    return settings.enabledPlugins[metadata.id]
  }, [metadata.id, settings.enabledPlugins])

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

  return (
    <div className="plugin-display">
      <Chip className="status-chip" color={enabled ? 'success' : 'warning'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </Chip>
      {metadata.icon_image && (
        <img
          className="plugin-icon"
          src={`data:image/${metadata.icon_image.extension};base64,${metadata.icon_image.base64}`}
        />
      )}
      <Dropdown>
        <MenuButton className="name-chip" variant="solid">
          {metadata.name}
        </MenuButton>
        <Menu placement="top-end">
          <MenuItem
            onClick={() => {
              if (enabled) {
                dispatchPluginState({ type: 'disable_plugin', payload: metadata.id })
                dispatchAppInfoState({
                  type: 'set_plugin_enabled',
                  payload: { pluginID: metadata.id, enabled: false },
                })
              } else {
                enablePlugin()
              }
            }}
          >
            {enabled ? 'Disable' : 'Enable'}
          </MenuItem>
          <MenuItem disabled>Delete</MenuItem>
        </Menu>
      </Dropdown>
    </div>
  )
}
