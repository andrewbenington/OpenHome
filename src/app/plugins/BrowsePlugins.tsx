import { Chip, CircularProgress, LinearProgress, Switch } from '@mui/joy'
import * as E from 'fp-ts/lib/Either'
import { useCallback, useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/backend/backendContext'
import useDisplayError from 'src/hooks/displayError'
import useIsDev from 'src/hooks/isDev'
import { AppInfoContext } from 'src/state/appInfo'
import { PluginContext } from 'src/state/plugin'
import { loadPlugin, PluginMetadata, PluginMetadataWithIcon } from 'src/util/Plugin'
import { ErrorIcon } from '../../components/Icons'
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
  const backend = useContext(BackendContext)
  const isDev = useIsDev()

  useEffect(() => {
    backend.updateSettings(settings).catch(console.error)
  }, [settings, backend])

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
    <CircularProgress style={{ margin: 'auto', width: '100%', height: '100%' }} color="secondary" />
  ) : (
    <div style={{ padding: 16 }}>
      {isDev && (
        <label style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Switch
            checked={useDevRepo}
            onChange={(e) => {
              setAvailablePlugins({})
              setUseDevRepo(e.target.checked)
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
            E.match(
              (err) => displayError('Load Plugin Code', err),
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
              }
            )
          )
          .catch((e) => {
            console.error(e)
            displayError('Error Downloading Plugin', [name, `${e}`])
          })
      }}
    >
      {installed && progressPercent === undefined && (
        <Chip className="status-chip" color="success" variant="solid">
          Installed
        </Chip>
      )}
      {error ? (
        <ErrorIcon className="error-icon-button" />
      ) : metadata ? (
        <img className="plugin-icon" src={`${location}/icon.png`} />
      ) : (
        <CircularProgress />
      )}
      {progressPercent !== undefined && (
        <LinearProgress
          className="plugin-progress"
          value={progressPercent}
          determinate
          color="secondary"
          variant="soft"
        />
      )}
      <div className="name-chip" style={{ width: '100%' }}>
        {name}
      </div>
    </button>
  )
}