import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ErrorIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import useIsDev from '@openhome-ui/hooks/isDev'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { PluginContext } from '@openhome-ui/state/plugin'
import { loadPlugin, PluginMetadata, PluginMetadataWithIcon } from '@openhome-ui/util/plugin'
import { Badge, Flex, Progress, Spinner, Switch } from '@radix-ui/themes'
import { useCallback, useContext, useEffect, useState } from 'react'
import { CURRENT_PLUGIN_API_VERSION } from './Plugins'
import './style.css'

const GITHUB_REPO =
  'https://raw.githubusercontent.com/andrewbenington/OpenHome-Plugins/refs/heads/main'
const LOCAL_REPO = 'http://127.0.0.1:5500'

export default function BrowsePlugins() {
  const displayError = useDisplayError()
  const [installedPlugins, setInstalledPlugins] = useState<PluginMetadataWithIcon[]>()
  const [availablePlugins, setAvailablePlugins] = useState<Record<string, string>>()
  const [loading, setLoading] = useState(false)
  const [useDevRepo, setUseDevRepo] = useState(false)
  const [{ settings }] = useContext(AppInfoContext)
  const [pluginState, dispatchPluginState] = useContext(PluginContext)
  const backend = useContext(BackendContext)
  const isDev = useIsDev()

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

  useEffect(() => {
    setLoading(true)
    fetch(`${useDevRepo ? LOCAL_REPO : GITHUB_REPO}/plugins-v2.json`)
      .then(async (resp) => {
        setLoading(false)
        try {
          const response: { v2: Record<string, string> } = await resp.json()
          const available = response.v2

          setAvailablePlugins(available)
        } catch (e) {
          console.error(e)
          setAvailablePlugins({})
          displayError('Error Finding Available Plugins', `${e}`)
        }
      })
      .finally(() => {
        dispatchPluginState({ type: 'set_loaded', payload: true })
        setLoading(false)
      })
  }, [displayError, useDevRepo, dispatchPluginState])

  const loadInstalled = useCallback(
    async () =>
      backend.listInstalledPlugins().then(
        R.match(
          (plugins) => setInstalledPlugins(plugins),
          (err) => displayError('Error Getting Installed Plugins', err)
        )
      ),
    [backend, displayError]
  )

  useEffect(() => {
    if (installedPlugins && pluginState.loaded) return
    loadInstalled()
  }, [installedPlugins, loadInstalled, pluginState.loaded])

  return loading ? (
    <Flex direction="column" justify="center" height="100%">
      <Spinner style={{ margin: 'auto', height: 32 }} />
    </Flex>
  ) : (
    <div style={{ padding: 16 }}>
      {isDev && (
        <label className="flex-row" style={{ gap: 8, marginBottom: 8 }}>
          <Switch
            checked={useDevRepo}
            onCheckedChange={(val) => {
              setAvailablePlugins({})
              setUseDevRepo(val)
            }}
          />
          Use Local Repo
        </label>
      )}
      <div style={{ gap: 8, display: 'flex', flexWrap: 'wrap' }}>
        {availablePlugins &&
          Object.entries(availablePlugins).map(([name, location]) => (
            <AvailablePluginCard
              key={name}
              name={name}
              location={location}
              useDevRepo={useDevRepo}
              reloadInstalled={loadInstalled}
              installedInstance={installedPlugins?.find((plugin) => plugin.name === name)}
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
  installedInstance?: PluginMetadataWithIcon
}

function AvailablePluginCard(props: AvailablePluginCardProps) {
  const { name, location, useDevRepo, reloadInstalled, installedInstance } = props
  const [metadata, setMetadata] = useState<PluginMetadata>()
  const [error, setError] = useState<string>()
  const displayError = useDisplayError()
  const [, dispatchPlugins] = useContext(PluginContext)
  const [progressPercent, setProgressPercent] = useState<number>()
  const backend = useContext(BackendContext)

  useEffect(() => {
    if (!metadata?.id) return
    // returns a function to stop listening
    const stopListening = backend.registerListeners({
      onPluginDownloadProgress: [
        metadata.id,
        (percent) => {
          setProgressPercent(percent)
        },
      ],
    })

    // the "stop listening" function should be called when the effect returns,
    // otherwise duplicate listeners will exist
    return () => {
      stopListening()
    }
  }, [backend, metadata])

  useEffect(() => setError(undefined), [location])

  useEffect(() => {
    if (error) return

    fetch(`${location}/plugin.json`)
      .then(async (p) => {
        const body = await p.text()

        setMetadata(JSON.parse(body))
      })
      .catch((e) => {
        console.error(e)
        setError(`${e}`)
      })
  }, [displayError, location, name, error, useDevRepo])

  return (
    <button
      className="plugin-display"
      onClick={() => {
        if (error) {
          displayError('Could not load plugin data', error)
          return
        }

        backend
          .downloadPlugin(location)
          .then(
            R.match(
              (code) => {
                try {
                  setProgressPercent(100)
                  dispatchPlugins({ type: 'register_plugin', payload: loadPlugin(code) })
                  reloadInstalled()
                  setTimeout(() => {
                    // show full progress bar for 200s before hiding
                    setProgressPercent(undefined)
                  }, 200)
                } catch (e) {
                  displayError('Error Installing Plugin', [name, `${e}`])
                }
              },
              (err) => displayError('Load Plugin Code', err)
            )
          )
          .catch((e) => {
            console.error(e)
            displayError('Error Downloading Plugin', [name, `${e}`])
          })
      }}
    >
      {error ? (
        <ErrorIcon className="error-icon-button" />
      ) : metadata ? (
        <img className="plugin-icon" src={`${location}/icon.png`} />
      ) : (
        <Spinner style={{ margin: 'auto', height: 32 }} />
      )}
      {progressPercent === undefined &&
      installedInstance &&
      installedInstance.api_version < CURRENT_PLUGIN_API_VERSION ? (
        <Badge className="status-chip" color="tomato" variant="solid">
          Update...
        </Badge>
      ) : (
        installedInstance &&
        progressPercent === undefined && (
          <Badge className="status-chip" color="green" variant="solid">
            Installed
          </Badge>
        )
      )}
      {progressPercent !== undefined && (
        <Progress className="plugin-progress" value={progressPercent} />
      )}
      <div className="name-chip" style={{ width: '100%' }}>
        {name}
      </div>
      {installedInstance && (
        <Badge
          title={location}
          className="version-badge"
          variant="solid"
          color="gray"
          radius="large"
        >
          v{installedInstance?.api_version}
        </Badge>
      )}
    </button>
  )
}
