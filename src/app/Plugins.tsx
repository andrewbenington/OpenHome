import { Chip, CircularProgress, Switch } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import useDisplayError from 'src/hooks/displayError'
import useIsDev from 'src/hooks/isDev'
import { PluginContext } from 'src/state/plugin'
import { loadPlugin, PluginMetadata, PluginMetadataWithIcon } from 'src/util/Plugin'

const GITHUB_REPO =
  'https://raw.githubusercontent.com/andrewbenington/OpenHome-Plugins/refs/heads/main'
const LOCAL_REPO = 'http://127.0.0.1:5500'

export default function PluginsPage() {
  const displayError = useDisplayError()
  const [installedPlugins, setInstalledPlugins] = useState<PluginMetadataWithIcon[]>()
  const [availablePlugins, setAvailablePlugins] = useState<Record<string, string>>()
  const [loading, setLoading] = useState(false)
  const [useDevRepo, setUseDevRepo] = useState(true)
  const backend = useContext(BackendContext)
  const isDev = useIsDev()

  useEffect(() => {
    setLoading(true)
    fetch(`${useDevRepo ? LOCAL_REPO : GITHUB_REPO}/plugins.json`)
      .then(async (resp) => {
        setLoading(false)
        try {
          const available: Record<string, string> = await resp.json()

          setAvailablePlugins(available)
        } catch (e) {
          console.error(e)
          setAvailablePlugins({})
          displayError('Error Finding Available Plugins', `${e}`)
        }
      })
      .catch((e) => {
        console.error(e)
        displayError('Error Getting Plugins', [`${e}`])
      })
      .finally(() => setLoading(false))
  }, [displayError, useDevRepo])

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

  return loading ? (
    <CircularProgress />
  ) : (
    <div style={{ padding: '0px 32px' }}>
      {isDev && (
        <label style={{ display: 'flex', flexDirection: 'row' }}>
          Use Local Repo
          <Switch
            checked={useDevRepo}
            onChange={(e) => {
              setAvailablePlugins({})
              setUseDevRepo(e.target.checked)
            }}
          />
        </label>
      )}
      <h2>Installed Plugins</h2>
      <div style={{ gap: 8, display: 'flex', flexWrap: 'wrap' }}>
        {installedPlugins &&
          Object.entries(installedPlugins).map(([, metadata]) => (
            <InstalledPluginCard key={metadata.id} metadata={metadata} />
          ))}
      </div>
      <h2>Add Plugins</h2>
      <div style={{ gap: 8, display: 'flex', flexWrap: 'wrap' }}>
        {availablePlugins &&
          Object.entries(availablePlugins).map(([name, location]) => (
            <AvailablePluginCard
              key={name}
              name={name}
              location={location}
              useDevRepo={useDevRepo}
              reloadInstalled={loadInstalled}
              installed={installedPlugins?.some((plugin) => plugin.name === name) ?? false}
            />
          ))}
      </div>
    </div>
  )
}

type AvailablePluginCardProps = {
  name: string
  location: string
  useDevRepo?: boolean
  reloadInstalled: () => void
  installed: boolean
}

function AvailablePluginCard(props: AvailablePluginCardProps) {
  const { name, location, useDevRepo, reloadInstalled, installed } = props
  const [metadata, setMetadata] = useState<PluginMetadata>()
  const [isError, setIsError] = useState(false)
  const displayError = useDisplayError()
  const [, dispatchPlugins] = useContext(PluginContext)
  const backend = useContext(BackendContext)

  useEffect(() => setIsError(false), [location])

  useEffect(() => {
    if (isError) return

    fetch(`${location}/plugin.json`)
      .then(async (p) => {
        const body = await p.text()

        setMetadata(JSON.parse(body))
      })
      .catch((e) => {
        console.error(e)
        setIsError(true)
        displayError('Error Installing Plugin', [
          `Plugin name: ${name}`,
          `Plugin location: ${location}/plugin.json`,
          `${e}`,
        ])
      })
  }, [displayError, location, name, isError, useDevRepo])

  return (
    <button
      style={{
        width: 200,
        height: 200,
        padding: '0px',
        backdropFilter: installed ? 'greyscale(1)' : undefined,
        cursor: installed ? 'default' : 'pointer',
        position: 'relative',
      }}
      disabled={installed}
      onClick={() => {
        backend
          .downloadPlugin(location)
          .then(
            E.match(
              (err) => {
                displayError('Load Plugin Code', err)
              },
              (code) => {
                try {
                  dispatchPlugins({ type: 'register_plugin', payload: loadPlugin(code) })
                  reloadInstalled()
                } catch (e) {
                  displayError('Error Installing Plugin', [name, `${e}`])
                }
              }
            )
          )
          .catch((e) => {
            console.error(e)
            displayError('Error Downloading Plugin', [name, `${e}`])
          })
      }}
    >
      {installed && (
        <Chip style={{ position: 'absolute', top: 4, right: 4 }} color="success" variant="solid">
          Installed
        </Chip>
      )}
      <img
        src={`${location}/${metadata?.icon}`}
        style={{
          height: 150,
          imageRendering: 'pixelated',
        }}
      />
      <Chip style={{ width: '100%' }}>{name}</Chip>
    </button>
  )
}

function InstalledPluginCard(props: { metadata: PluginMetadataWithIcon }) {
  const { metadata } = props
  const [pluginState, dispatchPluginState] = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()

  const enabled = useMemo(() => {
    return pluginState.plugins.some((plugin) => plugin.pluginID === metadata.id)
  }, [metadata.id, pluginState.plugins])

  return (
    <button
      style={{ width: 200, height: 200, position: 'relative' }}
      onClick={() => {
        if (enabled) {
          dispatchPluginState({ type: 'disable_plugin', payload: metadata.id })
        } else {
          backend.loadPluginCode(metadata.id).then(
            E.match(
              (err) => {
                displayError('Load Plugin Code', err)
              },
              (code) => {
                try {
                  dispatchPluginState({ type: 'register_plugin', payload: loadPlugin(code) })
                } catch (e) {
                  displayError('Error Loading Plugin', `${e}`)
                }
              }
            )
          )
        }
      }}
    >
      <Chip
        style={{ position: 'absolute', top: 4, right: 4 }}
        color={enabled ? 'success' : 'warning'}
      >
        {enabled ? 'Enabled' : 'Disabled'}
      </Chip>
      {metadata.icon_image && (
        <img
          src={`data:image/${metadata.icon_image.extension};base64,${metadata.icon_image.base64}`}
          style={{ imageRendering: 'pixelated', height: 150 }}
        />
      )}
      <Chip style={{ width: '100%' }}>{metadata.name}</Chip>
    </button>
  )
}
