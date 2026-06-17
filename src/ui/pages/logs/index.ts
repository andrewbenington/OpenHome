import { R } from '@openhome-core/util/functional'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useContext, useEffect, useState } from 'react'
import { OhpkmIdentifier } from 'src/core/pkm/Lookup'
import { BackendContext } from 'src/ui/backend/backendContext'
import { LogEntry, LogLevel, LogsResponse } from 'src/ui/backend/backendInterface'
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

function defaultLogFilter(ohpkm_id?: OhpkmIdentifier): LogFilter {
  const today = dayjs()
  const yesterday = today.add(-2, 'day')

  return {
    start: yesterday,
    end: today,
    ohpkm_id,
  }
}

export function useTodayLogs(openhomeIdFilter?: OhpkmIdentifier) {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const [current, setCurrent] = useState<LogFilter>(defaultLogFilter(openhomeIdFilter))
  const [next, setNext] = useState<LogFilter>()
  const { levels, setLevels, filterText, setFilterText } = useFilter(logs ?? [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const getLogs = useCallback(
    async (filter: LogFilter) => {
      setLoading(true)
      await backend
        .getLogs(filter)
        .then(
          R.match(
            (response: LogsResponse) => {
              if (response.current.end <= current.start) {
                setLogs([...(logs ?? []), ...response.remaining_file_lines])
                setCurrent({ ...response.current, start: response.current.start, end: current.end })
              } else {
                setLogs(response.remaining_file_lines)
                setCurrent(response.current)
              }
              setNext(response.next)
            },
            (err: string) => setError(err)
          )
        )
        .finally(() => setLoading(false))
    },
    [backend, logs, current]
  )

  const clearLogs = useCallback(() => {
    setLoading(true)
    backend
      .clearLogsForRange(current.start, current.end)
      .then(R.mapErr(setError))
      .finally(async () => {
        await getLogs(current)
        setLoading(false)
      })
  }, [backend, getLogs, current])

  const debouncedGetLogs = useDebounce(getLogs, 300)

  useEffect(() => {
    const cleanup = backend.onNewLog((_notification) => {
      debouncedGetLogs(current)
    })

    return cleanup
  }, [backend, debouncedGetLogs, current])

  useEffect(() => {
    if (logs === undefined) {
      getLogs(current)
    }
  }, [getLogs, logs, current])

  const loadNext = useCallback(async () => {
    if (next) {
      setLoading(true)
      await getLogs(next)
    }
  }, [getLogs, next])

  const resetToToday = useCallback(async () => {
    const todayCurrent = defaultLogFilter()
    setLogs([])
    setCurrent(todayCurrent)
    setNext(undefined)
    await getLogs(todayCurrent)
  }, [getLogs])

  if (logs && !error) {
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
      next,
      loadNext,
      resetToToday,
      loading,
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
