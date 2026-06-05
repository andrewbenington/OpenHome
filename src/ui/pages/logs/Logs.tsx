import { Text, TextField } from '@radix-ui/themes'
import dayjs from 'dayjs'
import { useContext, useEffect, useState } from 'react'
import { R } from 'src/core/util/functional'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry } from 'src/ui/backend/backendInterface'
import { DevDataDisplay } from 'src/ui/components/DevDataDisplay'
import { cssClass } from 'src/ui/util/style'
import './Logs.css'

const ALL_LEVELS = ['trace', 'debug', 'log', 'info', 'warn', 'error'] as const

export default function Logs() {
  const logData = useTodayLogs()
  const [filter, setFilter] = useState<string>('')

  if (logData.logs) {
    return (
      <div className="logs-page">
        <div className="logs-header">
          <h1 className="pokedex-header-title">OpenHome Logs</h1>
          {ALL_LEVELS.map((level) => (
            <button
              className={`log-level log-level-${level}`}
              key={level}
              // type: ignore
              onClick={() =>
                // eslint-disable-next-line no-console
                console[level]({ level }, `this is a ${level} message`)
              }
            >
              {level.toLocaleUpperCase()}
            </button>
          ))}
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
              <LogLine key={log.timestamp} log={log} />
            ))}
        </div>
      </div>
    )
  }
  return <div>{logData.loading ? 'Loading' : logData.error} </div>
}

type LogLineProps = {
  log: LogEntry
}

function LogLine({ log }: LogLineProps) {
  return (
    <div className="log-line" key={log.timestamp}>
      <span className="log-timestamp">{dayjs(log.timestamp).format('LTS')}</span>
      <span className={`log-level log-level-${log.level.toLowerCase()}`}>{log.level}</span>
      <span className={cssClass('log-message').with('log-message-empty').if(!log.message).build()}>
        {log.message || '(empty)'}
      </span>
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
