import { BackendContext } from '@openhome-core/backend/backendContext'
import { LogEntry, LogLevel, LogsResponse } from '@openhome-core/backend/backendInterface'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { R } from '@openhome-core/util/functional'
import useDebounce from '@openhome-ui/hooks/debounce'
import dayjs, { Dayjs } from 'dayjs'
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'

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
  return logFilterForRange(yesterday, today, ohpkm_id)
}

function logFilterForRange(start: Dayjs, end: Dayjs, ohpkm_id?: OhpkmIdentifier): LogFilter {
  return { start, end, ohpkm_id }
}

export function useLogController(openhomeIdFilter?: OhpkmIdentifier) {
  const backend = useContext(BackendContext)
  const [logs, setLogs] = useState<LogEntry[]>()
  const [current, setCurrent] = useState<LogFilter>(defaultLogFilter(openhomeIdFilter))
  const [next, setNext] = useState<LogFilter>()
  const { levels, setLevels, filterText, setFilterText } = useFilter(logs ?? [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const getLogs = useCallback(
    async (filter: LogFilter, clearExisting?: boolean) => {
      setLoading(true)
      await backend
        .getLogs(filter)
        .then(
          R.match(
            (response: LogsResponse) => {
              if (response.current.end <= current.start && !clearExisting) {
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
    const todayCurrent = defaultLogFilter(openhomeIdFilter)
    setLogs([])
    setCurrent(todayCurrent)
    setNext(undefined)
    await getLogs(todayCurrent)
  }, [getLogs, openhomeIdFilter])

  const loadRange = useCallback(
    async (start: Dayjs, end: Dayjs) => {
      const rangeCurrent = logFilterForRange(start, end, openhomeIdFilter)
      setLogs([])
      setCurrent(rangeCurrent)
      setNext(undefined)
      await getLogs(rangeCurrent, true)
    },
    [getLogs, openhomeIdFilter]
  )

  if (logs && !error) {
    const filteredLogs = logs.filter(
      (log) =>
        (!filterText ||
          log.message.toLocaleLowerCase().includes(filterText?.toLocaleLowerCase())) &&
        levels.has(log.level as LogLevel)
    )

    const controller: LogController = {
      logs,
      filteredLogs,
      filterText,
      setFilterText,
      levels,
      setLevels,
      clearLogs,
      current,
      next,
      loadNext,
      loadRange,
      resetToToday,
      loading,
      error: undefined,
    }

    return controller
  } else {
    return { logs: undefined, filteredLogs: undefined, loading, error } as const
  }
}

export type LogController = {
  readonly logs: LogEntry[]
  readonly filteredLogs: LogEntry[]
  readonly filterText: string
  readonly setFilterText: Dispatch<SetStateAction<string>>
  readonly levels: Set<LogLevel>
  readonly setLevels: Dispatch<SetStateAction<Set<LogLevel>>>
  readonly clearLogs: () => void
  readonly current: LogFilter
  readonly loadRange: (start: Dayjs, end: Dayjs) => Promise<void>
  readonly next: LogFilter | undefined
  readonly loadNext: () => Promise<void>
  readonly resetToToday: () => Promise<void>
  readonly loading: boolean
  readonly error: undefined
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
