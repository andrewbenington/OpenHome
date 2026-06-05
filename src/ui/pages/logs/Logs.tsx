import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details/Modal'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { cssClass } from '@openhome-ui/util/style'
import { Text, TextField } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { useContext, useEffect, useState } from 'react'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry } from 'src/ui/backend/backendInterface'
import { DevDataDisplay } from 'src/ui/components/DevDataDisplay'
import './Logs.css'

export default function Logs() {
  const logData = useTodayLogs()
  const [filter, setFilter] = useState<string>('')
  const [selectedMon, setSelectedMon] = useState<OHPKM>()
  const ohpkmStore = useOhpkmStore()

  if (logData.logs) {
    return (
      <div className="logs-page">
        <div className="logs-header">
          <h1 className="pokedex-header-title">OpenHome Logs</h1>
          <div style={{ flex: 1 }} />
          <Text>
            <b>Log count:</b> {logData.logs.length}
          </Text>
          <TextField.Root
            className="pokedex-filter-field"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="logs-container">
          {logData.logs
            .filter((log) => log.message.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
            .map((log) => (
              <LogLine
                key={log.timestamp}
                log={log}
                onOhpkmClick={(identifier) => setSelectedMon(ohpkmStore.getById(identifier))}
              />
            ))}
        </div>
        <PokemonDetailsModal mon={selectedMon} onClose={() => setSelectedMon(undefined)} />
      </div>
    )
  }
  return <div>{logData.loading ? 'Loading' : logData.error} </div>
}

type LogLineProps = {
  log: LogEntry
  onOhpkmClick: (openhomeId: OhpkmIdentifier) => void
}

function LogLine({ log, onOhpkmClick }: LogLineProps) {
  const { ohpkm_id, timestamp, level, message } = log
  const mon = useOhpkmStore().getById(ohpkm_id ?? '')

  return (
    <div className="log-line" key={timestamp}>
      <span className="log-timestamp">{dayjs(timestamp).format('LTS')}</span>
      <span className={`log-level log-level-${level.toLowerCase()}`}>{level}</span>
      <span
        className={cssClass('log-message')
          .with('log-message-empty')
          .if(message === '(empty)')
          .build()}
      >
        {message}
      </span>
      {ohpkm_id && mon && (
        <button className="log-ohpkm-button" onClick={() => onOhpkmClick(ohpkm_id)}>
          <PokemonIcon dexNumber={mon.dexNum} formeNumber={mon.formNum} />
        </button>
      )}
      <DevDataDisplay data={log} label="context" />
    </div>
  )
}

function useTodayLogs() {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (logs === undefined) {
      setLoading(true)
      backend
        .getLogs()
        .then(R.match(setLogs, setError))
        .finally(() => setLoading(false))
    }
  }, [backend, logs])

  return logs
    ? ({ logs, loading: false, error: undefined } as const)
    : ({
        loading,
        error,
        logs: undefined,
      } as const)
}
