import { useContext, useEffect, useState } from 'react'
import { R } from 'src/core/util/functional'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry } from 'src/ui/backend/backendInterface'
import { Flex, Text, TextField } from '@radix-ui/themes'
import './Logs.css'
import dayjs from 'dayjs'

export default function Logs() {
  const logData = useTodayLogs()
  const [filter, setFilter] = useState<string>('')

  if (logData.logs) {
    return (
      <div className="logs-container">
        <div className="pokedex-page">
          <div className="pokedex-header">
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
          {logData.logs.filter(
            (log) => log.message.toLocaleLowerCase().includes(filter.toLocaleLowerCase())).map((log) => (
              <div className="log-line" key={log.timestamp}>
                <span className="log-timestamp">{dayjs(log.timestamp).format("LTS")}</span>{log.message}
              </div>
            ))}
        </div>
      </div>
    )
  }
  return <div>{logData.loading ? 'Loading' : logData.error} </div>
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
