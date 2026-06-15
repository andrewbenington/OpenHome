import { R } from '@openhome-core/util/functional'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useContext, useEffect, useState } from 'react'
import { OhpkmIdentifier } from 'src/core/pkm/Lookup'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry, LogLevel } from 'src/ui/backend/backendInterface'
import useDebounce from 'src/ui/hooks/useDebounce'

export const LOG_LEVELS: readonly LogLevel[] = Object.freeze([
  'ERROR',
  'WARN',
  'INFO',
  'DEBUG',
  'TRACE',
])

export type LogFilter = {
  start: Dayjs
  end: Dayjs
  ohpkm_id?: OhpkmIdentifier
}

export function useTodayLogs() {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const { levels, setLevels, filterText, setFilterText } = useFilter(logs ?? [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const getLogs = useCallback(() => {
    const today = dayjs()
    const yesterday = today.add(-1, 'day')
    setLoading(true)
    backend
      .getLogs({ start: yesterday, end: today })
      .then(R.match(setLogs, setError))
      .finally(() => setLoading(false))
  }, [backend])

  const clearLogs = useCallback(() => {
    const today = dayjs()
    setLoading(true)
    backend
      .clearLogsForDate(today)
      .then(R.mapErr(setError))
      .finally(async () => {
        await getLogs()
        setLoading(false)
      })
  }, [backend, getLogs])

  const debouncedGetLogs = useDebounce(getLogs, 300)
  backend.onNewLog((_notification) => {
    debouncedGetLogs()
  })

  useEffect(() => {
    if (logs === undefined) {
      getLogs()
    }
  }, [getLogs, logs])

  if (logs) {
    const filteredLogs = logs.filter(
      (log) =>
        (!filterText ||
          log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
        levels.has(log.level as LogLevel)
    )

    return {
      logs,
      filteredLogs,
      filterText,
      setFilterText,
      levels,
      setLevels,
      clearLogs,
      loading: false,
      error: undefined,
    } as const
  } else {
    return { logs: undefined, loading, error } as const
  }
}

function useFilter(logs: LogEntry[]) {
  const [levels, setLevels] = useState(new Set(LOG_LEVELS))
  const [filterText, setFilterText] = useState('')

  const filteredLogs = logs.filter(
    (log) =>
      (!filterText || log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
      levels.has(log.level as LogLevel)
  )

  return {
    levels,
    setLevels,
    filterText,
    setFilterText,
    filteredLogs,
  }
}
